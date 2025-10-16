import { NextResponse } from "next/server";
import diseases from "../../diseaseQuestions.json";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface SeverityFormula {
  [key: string]: number;
}

interface DiseaseData {
  questions: { id: number; text: string; key: string; type: string }[];
  severityFormula: SeverityFormula;
}

interface Diseases {
  [key: string]: DiseaseData;
}

// Smart severity calculation function
function calculateSmartSeverity(
  responses: Record<string, any>,
  selectedDiseases: string[],
  matchedDiseases: DiseaseData[]
): { score: number; severity: string; details: string } {
  
  let totalScore = 0;
  let maxPossibleScore = 0;
  const criticalSymptoms: string[] = [];
  
  matchedDiseases.forEach((diseaseData, index) => {
    const severityFormula = diseaseData.severityFormula || {};
    const diseaseName = selectedDiseases[index];
    
    Object.keys(severityFormula).forEach(key => {
      const weight = severityFormula[key];
      const response = responses[key];
      maxPossibleScore += weight;
      
      if (response !== undefined && response !== null) {
        let scoreContribution = 0;
        
        // Temperature-based scoring (Fahrenheit)
        if (key === 'temperature' && typeof response === 'number') {
          if (response >= 104) {
            scoreContribution = weight * 1.2; // 120% - Very high fever
            criticalSymptoms.push(`Very high fever (${response}°F)`);
          } else if (response >= 103) {
            scoreContribution = weight * 1.0; // 100% - High fever
            criticalSymptoms.push(`High fever (${response}°F)`);
          } else if (response >= 101) {
            scoreContribution = weight * 0.75; // 75% - Moderate fever
          } else if (response >= 99.5) {
            scoreContribution = weight * 0.5; // 50% - Low-grade fever
          } else if (response >= 98.6) {
            scoreContribution = weight * 0.25; // 25% - Slight elevation
          }
        }
        
        // Duration-based scoring (days)
        else if (key === 'duration' && typeof response === 'number') {
          if (response >= 14) {
            scoreContribution = weight * 1.0; // 100% - Chronic (2+ weeks)
            criticalSymptoms.push(`Prolonged duration (${response} days)`);
          } else if (response >= 7) {
            scoreContribution = weight * 0.8; // 80% - Extended (1-2 weeks)
          } else if (response >= 3) {
            scoreContribution = weight * 0.6; // 60% - Moderate (3-6 days)
          } else {
            scoreContribution = weight * 0.4; // 40% - Acute (1-2 days)
          }
        }
        
        // Blood pressure-based scoring
        else if (key === 'bp_level' && typeof response === 'string') {
          const bpMatch = response.match(/(\d+)\/(\d+)/);
          if (bpMatch) {
            const systolic = parseInt(bpMatch[1]);
            const diastolic = parseInt(bpMatch[2]);
            
            if (systolic >= 180 || diastolic >= 120) {
              scoreContribution = weight * 1.2; // Hypertensive crisis
              criticalSymptoms.push(`Severe hypertension (${response})`);
            } else if (systolic >= 140 || diastolic >= 90) {
              scoreContribution = weight * 0.9; // Stage 2 hypertension
            } else if (systolic >= 130 || diastolic >= 80) {
              scoreContribution = weight * 0.6; // Stage 1 hypertension
            } else {
              scoreContribution = weight * 0.3; // Elevated
            }
          }
        }
        
        // Frequency-based scoring (episodes per day)
        else if (key === 'frequency' && typeof response === 'number') {
          if (response >= 10) {
            scoreContribution = weight * 1.0; // Very frequent
            criticalSymptoms.push(`Very frequent episodes (${response}/day)`);
          } else if (response >= 6) {
            scoreContribution = weight * 0.8; // Frequent
          } else if (response >= 3) {
            scoreContribution = weight * 0.6; // Moderate
          } else {
            scoreContribution = weight * 0.4; // Occasional
          }
        }
        
        // Critical yes/no symptoms
        else if ((response === 'yes' || response === true) && 
                 (key === 'difficulty_breathing' || key === 'chest_pain' || 
                  key === 'blood_sputum' || key === 'blood_in_urine' || 
                  key === 'self_harm' || key === 'wave_pain')) {
          scoreContribution = weight * 1.2; // Critical symptoms get 120%
          criticalSymptoms.push(key.replace(/_/g, ' '));
        }
        
        // Regular yes/no symptoms
        else if (response === 'yes' || response === true) {
          scoreContribution = weight * 1.0; // 100%
        }
        
        // Text-based responses
        else if (typeof response === 'string') {
          const lowerResponse = response.toLowerCase();
          
          // Pain type
          if (key === 'pain_type' || key === 'cough_type') {
            if (lowerResponse.includes('constant') || lowerResponse.includes('severe') || 
                lowerResponse.includes('sharp') || lowerResponse.includes('radiating')) {
              scoreContribution = weight * 0.9;
            } else if (lowerResponse.includes('intermittent') || lowerResponse.includes('moderate')) {
              scoreContribution = weight * 0.6;
            } else {
              scoreContribution = weight * 0.4;
            }
          }
          
          // Discharge type
          else if (key === 'discharge_type') {
            if (lowerResponse.includes('green') || lowerResponse.includes('blood')) {
              scoreContribution = weight * 0.9;
              criticalSymptoms.push(`${lowerResponse} discharge`);
            } else if (lowerResponse.includes('yellow')) {
              scoreContribution = weight * 0.7;
            } else {
              scoreContribution = weight * 0.4;
            }
          }
          
          // Severity levels
          else if (key === 'severity') {
            if (lowerResponse.includes('severe')) {
              scoreContribution = weight * 1.0;
            } else if (lowerResponse.includes('moderate')) {
              scoreContribution = weight * 0.6;
            } else {
              scoreContribution = weight * 0.3;
            }
          }
        }
        
        totalScore += scoreContribution;
      }
    });
  });
  
  // Calculate percentage-based score (0-1 scale)
  const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  
  // Additional multipliers for multiple symptoms
  const symptomCount = Object.values(responses).filter(r => r === 'yes' || r === true).length;
  let multiplier = 1.0;
  
  if (symptomCount >= 5) {
    multiplier = 1.2; // Multiple symptoms compound severity
  } else if (symptomCount >= 3) {
    multiplier = 1.1;
  }
  
  // Critical symptoms always push to at least moderate
  if (criticalSymptoms.length > 0) {
    multiplier = Math.max(multiplier, 1.15);
  }
  
  const finalScore = Math.min(normalizedScore * multiplier, 1.0); // Cap at 1.0
  
  // Determine severity level with better thresholds
  let severity: string;
  let details: string;
  
  if (finalScore >= 0.75) {
    severity = "High";
    details = `critical condition with ${criticalSymptoms.length > 0 ? 'concerning symptoms including ' + criticalSymptoms.slice(0, 2).join(', ') : 'multiple severe symptoms'}`;
  } else if (finalScore >= 0.50) {
    severity = "Moderate-High";
    details = `significant condition requiring prompt medical attention${criticalSymptoms.length > 0 ? ', with ' + criticalSymptoms[0] : ''}`;
  } else if (finalScore >= 0.35) {
    severity = "Moderate";
    details = "concerning condition that needs proper care and monitoring";
  } else if (finalScore >= 0.20) {
    severity = "Low-Moderate";
    details = "mild to moderate condition requiring attention and home care";
  } else {
    severity = "Low";
    details = "mild condition that can be managed with rest and basic care";
  }
  
  return {
    score: finalScore,
    severity,
    details
  };
}

export async function POST(request: Request) {
  try {
    const { 
      responses, 
      diseases: selectedDiseases 
    }: { 
      responses: Record<string, any>; 
      diseases: string[] 
    } = await request.json();

    if (!selectedDiseases || selectedDiseases.length === 0) {
      return NextResponse.json({ message: "No diseases selected." }, { status: 400 });
    }

    const matchedDiseases = selectedDiseases
      .map((disease) => (diseases as Diseases)[disease])
      .filter(Boolean);

    if (matchedDiseases.length === 0) {
      return NextResponse.json({ message: "Invalid disease(s) selected." }, { status: 400 });
    }

    // Use the new smart severity calculation
    const severityResult = calculateSmartSeverity(responses, selectedDiseases, matchedDiseases);
    
    console.log("Severity Calculation Debug:", {
      responses,
      selectedDiseases,
      severityScore: severityResult.score.toFixed(3),
      severity: severityResult.severity,
      details: severityResult.details
    });

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) throw new Error("Missing Gemini API key.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        topK: 40,
      }
    });

    const prompt = `
ROLE: You are an expert medical AI assistant providing accurate, actionable health guidance. You MUST analyze symptoms carefully and provide severity-appropriate recommendations.

TASK: Generate a comprehensive health assessment with EXACTLY 5 sections. Each recommendation must be SPECIFIC and ACTIONABLE - no generic advice like "seek medical attention if symptoms worsen."

CRITICAL ANALYSIS CONTEXT:
- Symptoms/Conditions: ${selectedDiseases.join(", ")}
- Patient Responses: ${JSON.stringify(responses, null, 2)}
- CALCULATED SEVERITY: ${severityResult.severity} (Score: ${(severityResult.score * 10).toFixed(1)}/10)
- Clinical Assessment: This is a ${severityResult.details}

YOUR SEVERITY ASSESSMENT MUST MATCH: ${severityResult.severity}

JSON OUTPUT FORMAT (RETURN ONLY THIS):
{
  "severity": "string (MUST be one of: High, Moderate-High, Moderate, Low-Moderate, Low)",
  "severityScore": "number (0-10 scale)",
  "summary": "string",
  "precautions": "string",
  "medications": "string",
  "diet": "string",
  "prevention": "string"
}

CONTENT RULES:

1. SUMMARY (2-3 sentences):
   - Describe the condition based on actual symptoms provided
   - Use severity-appropriate language matching ${severityResult.severity}
   - Mention the most concerning symptoms

2. PRECAUTIONS (EXACTLY 5-6 actionable points):
   - SPECIFIC actions with measurable details (time, frequency, quantity)
   - NO generic statements like "seek medical attention if worse"
   - NO conditional statements
   - Format: "1. [Specific action with exact details]"

3. MEDICATIONS (EXACTLY 5-6 specific recommendations):
   - EXACT medicine names with dosages
   - Include timing and maximum daily limits
   - Format: "1. [Medicine] [dose] every [X hours] (max [limit])"

4. DIET (EXACTLY 5-6 dietary points):
   - 3 foods/drinks to CONSUME with quantities
   - 2-3 foods/drinks to AVOID
   - Format: "1. [Food/drink] - [specific instruction]"

5. PREVENTION (EXACTLY 5-6 preventive measures):
   - SPECIFIC actions with frequency/duration
   - Format: "1. [Action] - [when/how often]"

FORMATTING:
- Use numbered format: "1. ", "2. ", "3. "
- NO asterisks (*), bullets (•), or markdown
- Each point on new line using "\\n"
- One sentence per point (max 2 sentences)

SEVERITY-APPROPRIATE LANGUAGE:
- High/Moderate-High: "urgent", "immediate", "critical", "essential"
- Moderate: "important", "recommended", "necessary", "advised"
- Low-Moderate/Low: "suggested", "helpful", "beneficial"

Generate the assessment matching ${severityResult.severity} severity.`;

    const geminiResponse = await model.generateContent(prompt);
    const rawText = geminiResponse?.response?.text?.() || "{}";
    
    let jsonResponse;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        jsonResponse = JSON.parse(rawText);
      }
      
      const requiredFields = ['summary', 'precautions', 'medications', 'diet', 'prevention'];
      const missingFields = requiredFields.filter(field => !jsonResponse[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(', ')}`);
      }
      
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw response:", rawText);
      
      jsonResponse = {
        summary: `You are experiencing ${selectedDiseases.join(", ")} with ${severityResult.severity.toLowerCase()} severity. ${severityResult.details}. Proper care and monitoring are recommended.`,
        precautions: `1. Monitor your symptoms closely every 4-6 hours\n2. Rest adequately and avoid strenuous activities\n3. Stay hydrated with 8-10 glasses of water daily\n4. Maintain good hygiene and wash hands frequently\n5. Keep living space clean and well-ventilated`,
        medications: `1. Over-the-counter pain relievers as needed for symptom relief\n2. Follow package dosage instructions carefully\n3. Take medications with food to prevent stomach upset\n4. Keep track of all medications and times taken\n5. Consult healthcare provider for prescription recommendations`,
        diet: `1. Light, easily digestible meals throughout the day\n2. Include plenty of fresh fruits and vegetables\n3. Stay hydrated with water, clear broths, and herbal teas\n4. Avoid heavy, oily, and spicy foods\n5. Limit processed foods and added sugars`,
        prevention: `1. Practice thorough hand hygiene regularly\n2. Get 7-8 hours of quality sleep nightly\n3. Avoid close contact with sick individuals\n4. Maintain balanced diet and regular exercise\n5. Follow up with healthcare provider as needed`
      };
    }

    return NextResponse.json({ 
      message: jsonResponse,
      severity: severityResult.severity,
      severityScore: (severityResult.score * 10).toFixed(1),
      severityDetails: severityResult.details
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ 
      message: "Internal server error.", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}