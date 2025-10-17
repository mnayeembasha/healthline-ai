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
  const [severityLabel, setSeverityLabel] = useState<string>("Low");
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

      setTimeout(() => {
        questionInputRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      setQuestions([]);
    }
  }, [selectedDiseases]);

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
        const response = await fetch("/api/get-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responses,
            diseases: selectedDiseases,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          let parsedReport: DiagnosisResponse;

          if (typeof data.message === 'object') {
            parsedReport = {
              summary: data.message.summary || "",
              precautions: data.message.precautions || "",
              medications: data.message.medications || "",
              diet: data.message.diet || "",
              prevention: data.message.prevention || ""
            };
            
            // ALWAYS use backend severity (already on 0-10 scale)
            const backendSeverityScore = parseFloat(data.severityScore || "0");
            const backendSeverityLabel = data.severity || "Low";
            
            setSeverity(backendSeverityScore);
            setSeverityLabel(backendSeverityLabel);
            
            console.log("Backend severity:", {
              score: backendSeverityScore,
              label: backendSeverityLabel,
              details: data.severityDetails
            });
          } else {
            parsedReport = {
              summary: "",
              precautions: "",
              medications: "",
              diet: "",
              prevention: ""
            };
            setSeverity(0);
            setSeverityLabel("Low");
          }

          setDiagnosisReport(parsedReport);

          // Format the text for display - convert numbered lists to HTML
          const formatSection = (text: string) => {
            if (!text) return "";
            
            // Split by newlines and format
            const lines = text.split('\n').filter(line => line.trim());
            const formattedLines = lines.map(line => {
              const trimmedLine = line.trim();
              // Check if line starts with number
              if (/^\d+\./.test(trimmedLine)) {
                return `<div class="mb-2 pl-4">${trimmedLine}</div>`;
              }
              return `<div class="mb-2">${trimmedLine}</div>`;
            });
            
            return formattedLines.join('');
          };

          let combinedReport = "";

          if (parsedReport.summary) {
            combinedReport += `<div class="mb-6"><h3 class="text-lg font-semibold text-blue-700 mb-3">Summary</h3><div class="text-gray-700">${formatSection(parsedReport.summary)}</div></div>`;
          }

          if (parsedReport.precautions) {
            combinedReport += `<div class="mb-6"><h3 class="text-lg font-semibold text-blue-700 mb-3">Precautions</h3><div class="text-gray-700">${formatSection(parsedReport.precautions)}</div></div>`;
          }

          if (parsedReport.medications) {
            combinedReport += `<div class="mb-6"><h3 class="text-lg font-semibold text-teal-700 mb-3">Medications</h3><div class="text-gray-700">${formatSection(parsedReport.medications)}</div></div>`;
          }

          if (parsedReport.diet) {
            combinedReport += `<div class="mb-6"><h3 class="text-lg font-semibold text-teal-700 mb-3">Diet</h3><div class="text-gray-700">${formatSection(parsedReport.diet)}</div></div>`;
          }

          if (parsedReport.prevention) {
            combinedReport += `<div class="mb-6"><h3 class="text-lg font-semibold text-teal-700 mb-3">Prevention</h3><div class="text-gray-700">${formatSection(parsedReport.prevention)}</div></div>`;
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
        });
      } finally {
        setWaitingForResponse(false);
      }
    }
  };

  // Updated to match backend thresholds (0-10 scale)
  const getSeverityColor = (score: number) => {
    if (score < 2) return "text-emerald-500"; // 0-2: Low
    if (score < 3.5) return "text-lime-500";   // 2-3.5: Low-Moderate
    if (score < 5) return "text-yellow-500";   // 3.5-5: Moderate
    if (score < 7.5) return "text-orange-500"; // 5-7.5: Moderate-High
    return "text-rose-500";                     // 7.5-10: High
  };

  // Use backend-provided severity label
  const getSeverityLabel = () => {
    return severityLabel;
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Health Diagnosis Report", 10, 15);

    // Selected Diseases
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
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
    doc.text(`Severity Score: ${severity.toFixed(1)}/10 (${getSeverityLabel()})`, 10, yPos);

    // Clean function for PDF
    const cleanForPDF = (text: string) => {
      return text
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const addSection = (title: string, content: string) => {
      if (!content) return yPos;
      
      yPos += 15;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.text(title, 10, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 7;
      
      const cleanContent = cleanForPDF(content);
      const lines = doc.splitTextToSize(cleanContent, 180);
      
      lines.forEach((line: string) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 10, yPos);
        yPos += 6;
      });
      
      return yPos;
    };

    // Add sections
    yPos = addSection("Summary:", diagnosisReport.summary);
    yPos = addSection("Precautions:", diagnosisReport.precautions);
    yPos = addSection("Medications:", diagnosisReport.medications);
    yPos = addSection("Diet:", diagnosisReport.diet);
    yPos = addSection("Prevention:", diagnosisReport.prevention);

    // Add disclaimer
    yPos += 10;
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const disclaimer = doc.splitTextToSize(
      "Disclaimer: This information is for general knowledge and does not constitute medical advice. Consult a healthcare professional for proper diagnosis and treatment.",
      180
    );
    disclaimer.forEach((line: string) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 10, yPos);
      yPos += 5;
    });

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
      if (!specialists || !Array.isArray(specialists) || specialists.length === 0) {
        console.error("Specialists array is required and cannot be empty.");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/doctor/specialists`,
        { specialists },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

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
    setSeverityLabel("Low");

    toast({
      title: "Chat Cleared",
      description: "Start a new diagnosis by selecting symptoms.",
    });
  };

  // Format section for display with proper styling
  const formatSectionDisplay = (content: string) => {
    if (!content) return null;
    
    const lines = content.split('\n').filter(line => line.trim());
    
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          const isNumbered = /^\d+\./.test(trimmedLine);
          
          return (
            <div 
              key={index} 
              className={`${isNumbered ? 'pl-0' : ''} text-gray-700 leading-relaxed`}
            >
              {trimmedLine}
            </div>
          );
        })}
      </div>
    );
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
                {getSeverityLabel()}
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
                <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <FileTextIcon size={18} /> Summary
                </h3>
                <div className="text-gray-700">
                  {formatSectionDisplay(diagnosisReport.summary)}
                </div>
              </div>
            )}

            {diagnosisReport.precautions && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-lg border border-amber-200 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-lg font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <AlertCircleIcon size={18} /> Precautions
                </h3>
                <div className="text-gray-700">
                  {formatSectionDisplay(diagnosisReport.precautions)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {diagnosisReport.medications && (
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-5 rounded-lg border border-teal-200 shadow-sm transition-all hover:shadow-md">
                  <h3 className="text-lg font-semibold text-teal-700 mb-3">💊 Medications</h3>
                  <div className="text-gray-700">
                    {formatSectionDisplay(diagnosisReport.medications)}
                  </div>
                </div>
              )}

              {diagnosisReport.diet && (
                <div className="bg-gradient-to-r from-green-50 to-lime-50 p-5 rounded-lg border border-green-200 shadow-sm transition-all hover:shadow-md">
                  <h3 className="text-lg font-semibold text-green-700 mb-3">🥗 Diet</h3>
                  <div className="text-gray-700">
                    {formatSectionDisplay(diagnosisReport.diet)}
                  </div>
                </div>
              )}
            </div>

            {diagnosisReport.prevention && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-lg font-semibold text-purple-700 mb-3">🛡️ Prevention</h3>
                <div className="text-gray-700">
                  {formatSectionDisplay(diagnosisReport.prevention)}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Disclaimer:</strong> This information is for general knowledge and does not constitute medical advice. Always consult a qualified healthcare professional for proper diagnosis, treatment, and medical guidance. If symptoms worsen, persist, or new symptoms arise, seek immediate medical attention.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChatBot;