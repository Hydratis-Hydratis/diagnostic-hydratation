import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatOptions } from "./ChatOptions";
import { ChatInput } from "./ChatInput";
import { ProgressIndicator } from "./ProgressIndicator";
import { questions } from "@/data/questions";
import { DiagnosticData } from "@/types/diagnostic";
import pharmacistAvatar from "@/assets/pharmacist-avatar.jpg";
import { toast } from "@/hooks/use-toast";

interface Message {
  text: string;
  isBot: boolean;
  timestamp: string;
}

export const DiagnosticChat = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData>({});
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Display first question
    if (currentQuestionIndex === 0) {
      setTimeout(() => {
        addBotMessage(questions[0].text);
      }, 500);
    }
  }, []);

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        text,
        isBot: true,
        timestamp: getCurrentTime(),
      },
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        text,
        isBot: false,
        timestamp: getCurrentTime(),
      },
    ]);
  };

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Add user message
    addUserMessage(answer);
    
    // Save answer
    setDiagnosticData((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        addBotMessage(questions[currentQuestionIndex + 1].text);
      }, 800);
    } else {
      // Complete
      setTimeout(() => {
        setIsComplete(true);
        addBotMessage(
          "Merci beaucoup pour tes réponses ! 💧\n\nTon diagnostic d'hydratation a été enregistré. Tu recevras bientôt des recommandations personnalisées par email."
        );
        
        // Show success toast
        toast({
          title: "Diagnostic terminé !",
          description: "Merci d'avoir complété le questionnaire.",
        });
        
        // Log data (in production, send to backend)
        console.log("Diagnostic Data:", { ...diagnosticData, [currentQuestion.id]: answer });
      }, 800);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Progress Indicator */}
      {!isComplete && messages.length > 0 && (
        <ProgressIndicator current={currentQuestionIndex} total={questions.length} />
      )}
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message.text}
            isBot={message.isBot}
            avatar={message.isBot ? pharmacistAvatar : undefined}
            timestamp={message.timestamp}
          />
        ))}
        
        {/* Current Question Input/Options */}
        {!isComplete && messages.length > 0 && currentQuestion && (
          <div className="pt-4">
            {currentQuestion.type === "options" && currentQuestion.options ? (
              <ChatOptions
                options={currentQuestion.options}
                onSelect={handleAnswer}
                multiColumn={currentQuestion.multiColumn}
              />
            ) : (
              <ChatInput
                onSubmit={handleAnswer}
                placeholder={currentQuestion.placeholder}
                type={currentQuestion.inputType}
              />
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
