"use client";

import { useState, useEffect } from "react";
// import { saveAs } from "file-saver";
// import { useRouter } from "next/navigation";

import diseases from "@/data/diseaseQuestions.json";
console.log(diseases  )
import { jsPDF } from "jspdf";
import MultiSelect from "@/components/MultiSelect";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { htmlToText } from "html-to-text";
import axios  from "axios";
// const API_BASE_URL = 'https://resume-builder-backend-ab1h.onrender.com'
import { API_BASE_URL } from "@/config";
import Loader from "@/components/Loader"; // Import the Loader component

interface DiseaseQuestion {
  id: number;
  text: string;
  key: string;
  type: "number" | "yesno" | "text";
}

interface Disease {
  questions: DiseaseQuestion[];
  severityFormula: Record<string, number>;
  specialist:string[]
}

type Diseases = Record<string, Disease>;

interface Message {
  sender: "user" | "bot";
  text: string;
}

const ChatBot = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Welcome! Please select diseases or symptoms to begin diagnosis.",
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
  // const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  // const router = useRouter();

  // useEffect(() => {
  //   const token = localStorage.getItem("authToken");
  //   if (token) {
  //     setIsLoggedIn(true);
  //   } else {
  //     toast({
  //       title: "Unauthorized",
  //       description: "You must log in to access the chatbot.",
  //       variant: "destructive",
  //     });
  //     localStorage.setItem("redirectTo", "/chatbot");
  //     router.push("/login");
  //   }
  // }, [router, toast]);

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
    } else {
      setQuestions([]);
    }
  }, [selectedDiseases]);

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
          body: JSON.stringify({ responses, diseases: selectedDiseases }),
        });

        const data = await response.json();

        if (response.ok) {
          const severityValue = calculateSeverity();
          setSeverity(severityValue);

          const botMessage: Message = {
            sender: "bot",
            text: formatResponse(data.message),
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
          variant: "destructive",
        });
      } finally {
        setWaitingForResponse(false);
      }
    }
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

  const formatResponse = (response: string): string => {
    return response
      .replace(/\*\*(.*?)\*\*/g, (_, boldText) => `<strong>${boldText}</strong>`)
      .replace(/\n/g, "<br/>");
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Health Diagnosis Report", 10, 15);

    // Selected Diseases
    doc.setFontSize(12);
    doc.text("Selected Diseases:", 10, 30);
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
    doc.text(`Severity Score: ${severity}`, 10, yPos);

    // Diagnosis Response
    yPos += 15;
    doc.text("Diagnosis Response:", 10, yPos);
    const finalBotResponse = messages[messages.length - 1]?.text || "No response available";
    const plainTextResponse = htmlToText(finalBotResponse);
    const responseLines = doc.splitTextToSize(plainTextResponse, 180);

    const specialists = selectedDiseases.flatMap(
      (selectedDisease) => (diseases as Diseases)[selectedDisease]?.specialist || []
    );


    console.log("severity",severity);
    console.log("finalBotResponse",finalBotResponse);
    console.log("Specialist:", Array.from(specialists));

   sendReportToDoctor(severity,finalBotResponse,specialists);

    yPos += 10;
    responseLines.forEach((line: string | string[]) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 10, yPos);
      yPos += 10;
    });

    doc.save("health_diagnosis.pdf");
    toast({
      title: "PDF Generated",
      description: "Your health report has been downloaded.",
    });
  };

  const sendReportToDoctor = async (severity:number, finalBotResponse:string, specialists:string[]) => {
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
       const addedOp = await axios.post(`${API_BASE_URL}/api/op/add`,{
        report:finalBotResponse,
        userId:localStorage.getItem("userId")||"",
        doctorId:doctorId,
        severity:severity,
       },{
        headers:{
          "Authorization":`Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        }
       });
       console.log(addedOp);

    } catch (err) {
      // Improved error logging
      console.error("Some Error Occoured while Performing database operation:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24">
      <Card className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-primary">
          AI Health Assistant
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
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
        </div>

        <ScrollArea className="h-[400px] rounded-md border p-4 mb-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg ${msg.sender === "user"
                ? "bg-blue-600 text-primary-foreground ml-auto max-w-[80%]"
                : "bg-muted text-muted-foreground max-w-[80%]"
                }`}
            >
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
            </div>
          ))}
        </ScrollArea>

        {waitingForResponse && (
          <Loader message="Analyzing your symptoms and generating diagnosis..." />
        )}

        {selectedDiseases.length > 0 &&
          !waitingForResponse &&
          !isDiagnosisComplete &&
          currentQuestionIndex < questions.length && (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                {questions[currentQuestionIndex].text}
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
                  className="flex-1"
                />
                <Button onClick={handleSend}>Send</Button>
              </div>
            </div>
          )}

        {isDiagnosisComplete && (
          <Button
            onClick={handleGeneratePDF}
            className="w-full mt-4"
            variant="secondary"
          >
            Download Health Report (PDF)
          </Button>
        )}
      </Card>
    </div>
  );
};

export default ChatBot;