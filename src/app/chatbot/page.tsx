"use client";

import { useState, useEffect, useRef } from "react";
import diseases from "@/data/diseaseQuestions.json";
import { jsPDF } from "jspdf";
import MultiSelect from "@/components/MultiSelect";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import Loader from "@/components/Loader";
import {
  DownloadIcon,
  FileTextIcon,
  ActivityIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ArrowDownCircleIcon
} from "lucide-react";

interface DiseaseQuestion {
  id: number;
  text: string;
  key: string;
  type: "number" | "yesno" | "text";
}

interface Disease {
  questions: DiseaseQuestion[];
  severityFormula: Record<string, number>;
  specialist: string[];
}

type Diseases = Record<string, Disease>;

interface Message {
  sender: "user" | "bot";
  text: string;
}

interface DiagnosisResponse {
  summary: string;
  precautions: string;
  medications: string;
  diet: string;
  prevention: string;
}

const ChatBot = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Welcome! Please select symptoms or conditions to begin diagnosis.",
    },
  ]);
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [questions, setQuestions] = useState<DiseaseQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [input, setInput] = useState<string>("");
  const [waitingForResponse, setWaitingForResponse] = useState<boolean>(false);
  const [severity, setSeverity] = useState<number>(0);
  const [isDiagnosisComplete, setIsDiagnosisComplete] = useState<boolean>(false);
  const [diagnosisReport, setDiagnosisReport] = useState<DiagnosisResponse>({
    summary: "",
    precautions: "",
    medications: "",
    diet: "",
    prevention: ""
  });

  const questionInputRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDiseases.length > 0) {
      const combinedQuestions = selectedDiseases.flatMap(
        (disease) => (diseases as Diseases)[disease]?.questions || []
      );

      const uniqueQuestionsMap = new Map(
        combinedQuestions.map((q) => [q.key, q])
      );
      setQuestions(Array.from(uniqueQuestionsMap.values()));

      setResponses({});
      setCurrentQuestionIndex(0);

      // Scroll to the question input area when questions are set
      setTimeout(() => {
        questionInputRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      setQuestions([]);
    }
  }, [selectedDiseases]);

  // Scroll to bottom of chat when new messages come in
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !questions[currentQuestionIndex]) return;

    const question = questions[currentQuestionIndex];
    const userMessage: Message = { sender: "user", text: input };
    const questionMessage: Message = { sender: "bot", text: question.text };

    setMessages((prev) => [...prev, questionMessage, userMessage]);

    setResponses((prev) => ({
      ...prev,
      [question.key]:
        question.type === "number" ? parseInt(input) : input.toLowerCase(),
    }));

    setInput("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setWaitingForResponse(true);

      try {
        // Structure the request with a detailed prompt for properly formatted sections
        const promptInstructions = `
        Based on these symptoms (${selectedDiseases.join(", ")}) and the provided responses, generate a comprehensive health assessment with CLEARLY SEPARATED sections.

        YOUR RESPONSE MUST CONTAIN ALL FIVE OF THESE SECTIONS, each with substantial, specific content:

        1. Summary: Provide a concise overview of the condition and key insights.

        2. Precautions: List specific actions the person should take immediately to manage their condition safely.

        3. Medications: Recommend specific medications or treatments that could help alleviate symptoms, including dosage information when appropriate.

        4. Diet: Provide specific dietary recommendations, including foods to eat and avoid to help manage or improve the condition.

        5. Prevention: Detail specific measures to prevent recurrence or worsening of the condition in the future.

        Format each section with its own heading (e.g., "Summary:") and ensure each section has meaningful, detailed content. DO NOT return empty sections or generic placeholders.
        DO NOT use asterisks (*) for formatting or bullet points.
        Use proper formatting without markdown symbols visible in the output.
        `;

        const response = await fetch("/api/get-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responses,
            diseases: selectedDiseases,
            promptInstructions: promptInstructions,
            responseFormat: {
              structure: "json",
              sections: ["summary", "precautions", "medications", "diet", "prevention"]
            }
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const severityValue = calculateSeverity();
          setSeverity(severityValue);

          let parsedReport: DiagnosisResponse;

          // Try to parse the response as JSON first
          try {
            // If the response is already in JSON format
            if (typeof data.message === 'object') {
              parsedReport = {
                summary: data.message.summary || "",
                precautions: data.message.precautions || "",
                medications: data.message.medications || "",
                diet: data.message.diet || "",
                prevention: data.message.prevention || ""
              };
            } else {
              // Handle string format with improved parsing
              parsedReport = parseReportSections(data.message);
            }
          } catch (error) {
            console.log(error);
            // Fallback to regex parsing if JSON parsing fails
            parsedReport = parseReportSections(data.message);
          }

          // Remove default placeholder text by setting empty strings
          if (parsedReport.summary === "Based on your symptoms, a detailed summary couldn't be generated.") {
            parsedReport.summary = "";
          }
          if (parsedReport.precautions === "Take general health precautions and consult a healthcare professional if symptoms worsen.") {
            parsedReport.precautions = "";
          }
          if (parsedReport.medications === "No specific medications can be recommended without a proper medical examination.") {
            parsedReport.medications = "";
          }
          if (parsedReport.diet === "Maintain a balanced diet rich in fruits, vegetables, and adequate hydration.") {
            parsedReport.diet = "";
          }
          if (parsedReport.prevention === "Practice good hygiene, adequate rest, and avoid exposure to triggers.") {
            parsedReport.prevention = "";
          }

          setDiagnosisReport(parsedReport);

          // Clean any markdown artifacts from the text
          const cleanText = (text: string) => {
            return text
              .replace(/\*\*/g, '')  // Remove all asterisks
              .replace(/\*/g, '')    // Remove all asterisks
              .replace(/-\s/g, '• ') // Replace dash+space with bullet+space
              .trim();
          };

          // Only include sections that have content
          let combinedReport = "";

          if (parsedReport.summary) {
            combinedReport += `<strong>Summary:</strong><br/>${cleanText(parsedReport.summary)}<br/><br/>`;
          }

          if (parsedReport.precautions) {
            combinedReport += `<strong>Precautions:</strong><br/>${cleanText(parsedReport.precautions)}<br/><br/>`;
          }

          if (parsedReport.medications) {
            combinedReport += `<strong>Medications:</strong><br/>${cleanText(parsedReport.medications)}<br/><br/>`;
          }

          if (parsedReport.diet) {
            combinedReport += `<strong>Diet:</strong><br/>${cleanText(parsedReport.diet)}<br/><br/>`;
          }

          if (parsedReport.prevention) {
            combinedReport += `<strong>Prevention:</strong><br/>${cleanText(parsedReport.prevention)}`;
          }

          const botMessage: Message = {
            sender: "bot",
            text: combinedReport,
          };

          setMessages((prev) => [...prev, botMessage]);
          setIsDiagnosisComplete(true);

          toast({
            title: "Diagnosis Complete",
            description: "Your health report is ready!",
          });
        } else {
          setMessages((prev) => [...prev, { sender: "bot", text: data.message }]);
        }
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Failed to get diagnosis. Please try again.",
          // variant: "destructive",
        });
      } finally {
        setWaitingForResponse(false);
      }
    }
  };

  const parseReportSections = (text: string): DiagnosisResponse => {
    // Define more flexible patterns for each section with multiple heading possibilities
    const patterns = {
      summary: /(?:Summary:?|Assessment:?|Overview:?)(.*?)(?=\n\s*(?:Precautions|Safety|Medications|Diet|Prevention|$))/is,
      precautions: /(?:Precautions:?|Safety Measures:?|Immediate Actions:?)(.*?)(?=\n\s*(?:Medications|Treatment|Diet|Prevention|$))/is,
      medications: /(?:Medications:?|(?:Basic )?Medicines:?|Treatment:?)(.*?)(?=\n\s*(?:Diet|Nutrition|Prevention|$))/is,
      diet: /(?:Diet:?|Dietary Recommendations:?|Nutrition:?)(.*?)(?=\n\s*(?:Prevention|Preventive|$))/is,
      prevention: /(?:Prevention:?|(?:Measures to )?Prevent Recurrence:?|Preventive Measures:?)(.*?)$/is,
    };

    // If no sections are found, try to analyze entire text for intelligent content extraction
    const fullTextFallback = (text: string): DiagnosisResponse => {
      // Split by double newlines to find potential paragraphs
      const paragraphs = text.split(/\n\n+/);

      // Default response structure
      const result: DiagnosisResponse = {
        summary: "",
        precautions: "",
        medications: "",
        diet: "",
        prevention: ""
      };

      // Look for key indicators in each paragraph
      paragraphs.forEach(para => {
        const lowerPara = para.toLowerCase();

        // Simple heuristic matching for content types
        if (lowerPara.includes("summary") || (lowerPara.includes("condition") && !result.summary)) {
          result.summary = para.replace(/^summary:?\s*/i, "");
        } else if ((lowerPara.includes("precaution") || lowerPara.includes("safety") || lowerPara.includes("caution")) && !result.precautions) {
          result.precautions = para.replace(/^precautions:?\s*/i, "");
        } else if ((lowerPara.includes("medicat") || lowerPara.includes("medicine") || lowerPara.includes("treatment") || lowerPara.includes("drug")) && !result.medications) {
          result.medications = para.replace(/^medications:?\s*/i, "");
        } else if ((lowerPara.includes("diet") || lowerPara.includes("food") || lowerPara.includes("eat") || lowerPara.includes("nutrition")) && !result.diet) {
          result.diet = para.replace(/^diet:?\s*/i, "");
        } else if ((lowerPara.includes("prevent") || lowerPara.includes("avoid") || lowerPara.includes("future")) && !result.prevention) {
          result.prevention = para.replace(/^prevention:?\s*/i, "");
        }
      });

      return result;
    };

    // Try structured extraction first
    const report: DiagnosisResponse = {
      summary: extractSection(text, patterns.summary),
      precautions: extractSection(text, patterns.precautions),
      medications: extractSection(text, patterns.medications),
      diet: extractSection(text, patterns.diet),
      prevention: extractSection(text, patterns.prevention)
    };

    // If most sections are empty, try the fallback method
    if (!report.summary && !report.precautions && !report.medications && !report.diet && !report.prevention) {
      return fullTextFallback(text);
    }

    return report;
  };

  const extractSection = (text: string, pattern: RegExp): string => {
    const match = text.match(pattern);
    return match ? match[1].trim() : "";
  };

  const calculateSeverity = (): number => {
    let totalSeverity = 0;
    const diseasesCount = selectedDiseases.length;

    selectedDiseases.forEach((disease) => {
      const formula = (diseases as Diseases)[disease]?.severityFormula;
      let diseaseSeverity = 0;

      questions.forEach((question) => {
        if (responses[question.key]) {
          const weight = formula[question.key] || 0;
          diseaseSeverity +=
            (responses[question.key] === "yes" ? 1 : 0) * weight;
        }
      });

      totalSeverity += diseaseSeverity;
    });

    return diseasesCount > 0 ? totalSeverity / diseasesCount : 0;
  };

  const getSeverityColor = (severity: number) => {
    if (severity < 3) return "text-emerald-500";
    if (severity < 6) return "text-amber-500";
    return "text-rose-500";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 0.3) return "Low";
    if (severity <= 0.6) return "Moderate";
    return "High";
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Health Diagnosis Report", 10, 15);

    // Selected Diseases
    doc.setFontSize(12);
    doc.text("Selected Symptoms:", 10, 30);
    doc.text(selectedDiseases.join(", "), 60, 30);

    // Questions and Responses
    let yPos = 45;
    doc.text("Questions and Responses:", 10, yPos);
    questions.forEach((q) => {
      yPos += 10;
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`Q: ${q.text}`, 10, yPos);
      yPos += 7;
      doc.text(`A: ${responses[q.key] || "Not answered"}`, 15, yPos);
    });

    // Severity
    yPos += 10;
    doc.text(`Severity Score: ${severity} (${getSeverityLabel(severity)})`, 10, yPos);

    // Clean function to remove markdown artifacts
    const cleanForPDF = (text: string) => {
      return text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/-\s/g, '- ') // Keep dash format for PDF
        .trim();
    };

    // Add each section to PDF only if it has content
    yPos += 15;

    // Summary
    if (diagnosisReport.summary) {
      doc.setFont("helvetica", "bold");
      doc.text("Summary:", 10, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 10;
      const summaryLines = doc.splitTextToSize(cleanForPDF(diagnosisReport.summary), 180);
      summaryLines.forEach((line: string | string[]) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 10, yPos);
        yPos += 7;
      });
    }

    // Precautions
    if (diagnosisReport.precautions) {
      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Precautions:", 10, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 10;
      const precautionLines = doc.splitTextToSize(cleanForPDF(diagnosisReport.precautions), 180);
      precautionLines.forEach((line: string | string[]) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 10, yPos);
        yPos += 7;
      });
    }

    // Medications
    if (diagnosisReport.medications) {
      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Medications:", 10, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 10;
      const medicationLines = doc.splitTextToSize(cleanForPDF(diagnosisReport.medications), 180);
      medicationLines.forEach((line: string | string[]) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 10, yPos);
        yPos += 7;
      });
    }

    // Diet
    if (diagnosisReport.diet) {
      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Diet:", 10, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 10;
      const dietLines = doc.splitTextToSize(cleanForPDF(diagnosisReport.diet), 180);
      dietLines.forEach((line: string | string[]) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 10, yPos);
        yPos += 7;
      });
    }

    // Prevention
    if (diagnosisReport.prevention) {
      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Prevention:", 10, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 10;
      const preventionLines = doc.splitTextToSize(cleanForPDF(diagnosisReport.prevention), 180);
      preventionLines.forEach((line: string | string[]) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 10, yPos);
        yPos += 7;
      });
    }

    const specialists = selectedDiseases.flatMap(
      (selectedDisease) => (diseases as Diseases)[selectedDisease]?.specialist || []
    );

    sendReportToDoctor(severity, JSON.stringify(diagnosisReport), specialists);

    doc.save("health_diagnosis.pdf");
    toast({
      title: "PDF Generated",
      description: "Your health report has been downloaded.",
    });
  };

  const sendReportToDoctor = async (severity: number, finalBotResponse: string, specialists: string[]) => {
    try {
      // Validate input parameters
      if (!specialists || !Array.isArray(specialists) || specialists.length === 0) {
        console.error("Specialists array is required and cannot be empty.");
        return;
      }

      // Make the POST request to fetch doctors
      const response = await axios.post(
        `${API_BASE_URL}/api/doctor/specialists`,
        { specialists },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Log the response for debugging
      console.log("Doctors fetched successfully:", response.data.doctors[0].name);
      const doctorId = response.data.doctors[0]._id;
      const addedOp = await axios.post(`${API_BASE_URL}/api/op/add`, {
        report: finalBotResponse,
        userId: localStorage.getItem("userId") || "",
        doctorId: doctorId,
        severity: severity,
      }, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        }
      });
      console.log(addedOp);

    } catch (err) {
      // Improved error logging
      console.error("Some Error Occurred while Performing database operation:", err);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: "bot",
        text: "Chat cleared. Please select symptoms or conditions to begin a new diagnosis.",
      },
    ]);
    setSelectedDiseases([]);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResponses({});
    setInput("");
    setIsDiagnosisComplete(false);
    setDiagnosisReport({
      summary: "",
      precautions: "",
      medications: "",
      diet: "",
      prevention: ""
    });
    setSeverity(0);

    toast({
      title: "Chat Cleared",
      description: "Start a new diagnosis by selecting symptoms.",
    });
  };

  return (
    <div className="container mx-auto px-4 pt-20 pb-16">
      <Card className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-xl mb-8 border border-blue-100">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
          AI Health Assistant
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-blue-600">
            Select Symptoms or Conditions:
          </label>
          <MultiSelect
            options={Object.keys(diseases).map((disease) => ({
              value: disease,
              label: disease,
            }))}
            value={selectedDiseases}
            onValueChange={(values) => {
              setSelectedDiseases(values);
              setIsDiagnosisComplete(false);
            }}
            placeholder="Search and select symptoms..."
          />

          {selectedDiseases.length > 0 && (
            <div className="mt-3 text-center">
              <div className="text-blue-500 flex justify-center items-center gap-1 animate-bounce">
                <ArrowDownCircleIcon size={18} />
                <span className="text-sm font-medium">Answer questions below</span>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className={`${selectedDiseases.length > 0 && !isDiagnosisComplete ? 'h-[250px]' : 'h-[400px]'} rounded-md border border-blue-100 p-4 mb-6 bg-gradient-to-b from-blue-50 to-white`}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg shadow-sm ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white ml-auto max-w-[80%]"
                  : "bg-gradient-to-r from-slate-50 to-blue-50 text-gray-800 max-w-[80%] border border-blue-100"
              }`}
            >
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
            </div>
          ))}
          <div ref={chatEndRef} />
        </ScrollArea>

        <div className="flex justify-end mb-4">
          <Button
            onClick={handleClearChat}
            variant="outline"
            className="text-blue-600 border-blue-300 hover:bg-blue-50 flex items-center gap-1"
          >
            <RefreshCwIcon size={16} />
            Clear Chat
          </Button>
        </div>

        {waitingForResponse && (
          <Loader message="Analyzing your symptoms and generating diagnosis..." />
        )}

        <div ref={questionInputRef}>
          {selectedDiseases.length > 0 &&
            !waitingForResponse &&
            !isDiagnosisComplete &&
            currentQuestionIndex < questions.length && (
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100 animate-fadeIn">
                <p className="text-sm font-medium text-blue-700">
                  Question {currentQuestionIndex + 1} of {questions.length}: {questions[currentQuestionIndex].text}
                </p>
                <div className="flex gap-2">
                  <Input
                    type={
                      questions[currentQuestionIndex].type === "number"
                        ? "number"
                        : "text"
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your answer..."
                    className="flex-1 border-blue-200 focus:border-blue-400"
                    autoFocus
                  />
                  <Button
                    onClick={handleSend}
                    className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white transition-all duration-300"
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}
        </div>
      </Card>

      {isDiagnosisComplete && (
        <Card className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-xl overflow-hidden border border-blue-100 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
              <FileTextIcon size={24} className="text-blue-500" /> Health Diagnosis Report
            </h2>
            <Button
              onClick={handleGeneratePDF}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 transition-all duration-300"
            >
              <DownloadIcon size={18} /> Download PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
                <AlertCircleIcon size={16} /> Severity Level
              </h3>
              <p className={`text-2xl font-bold ${getSeverityColor(severity)}`}>
                {getSeverityLabel(severity)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Score: {severity.toFixed(1)}/10</p>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
                <ActivityIcon size={16} /> Symptoms
              </h3>
              <p className="text-gray-700">
                {selectedDiseases.join(", ")}
              </p>
            </Card>
          </div>

          <div className="space-y-6">
            {diagnosisReport.summary && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-lg font-medium text-blue-600 mb-3">Summary</h3>
                <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: diagnosisReport.summary.replace(/\*\*/g, '').replace(/\*/g, '') }}></div>
              </div>
            )}

            {diagnosisReport.precautions && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-lg font-medium text-blue-600 mb-3">Precautions</h3>
                <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: diagnosisReport.precautions.replace(/\*\*/g, '').replace(/\*/g, '') }}></div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              {diagnosisReport.medications && (
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-5 rounded-lg">
                  <h3 className="text-lg font-medium text-teal-600 mb-3">Medications</h3>
                  <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: diagnosisReport.medications.replace(/\*\*/g, '').replace(/\*/g, '') }}></div>
                  </div>
              )}

              {diagnosisReport.diet && (
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-5 rounded-lg">
                  <h3 className="text-lg font-medium text-teal-600 mb-3">Diet</h3>
                  <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: diagnosisReport.diet.replace(/\*\*/g, '').replace(/\*/g, '') }}></div>
                  </div>
              )}
            </div>

            {diagnosisReport.prevention && (
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-5 rounded-lg">
                <h3 className="text-lg font-medium text-teal-600 mb-3">Prevention</h3>
                <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: diagnosisReport.prevention.replace(/\*\*/g, '').replace(/\*/g, '') }}></div>
              </div>
            )}

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-700">
                <strong>Disclaimer:</strong> This information is for general knowledge and does not constitute medical advice. If symptoms worsen, persist, or new symptoms arise, seek professional medical evaluation.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChatBot;