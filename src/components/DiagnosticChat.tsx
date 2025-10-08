import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatOptions } from "./ChatOptions";
import { ChatInput } from "./ChatInput";
import { ColorScaleSelector } from "./ColorScaleSelector";
import { MultiSelectOptions } from "./MultiSelectOptions";
import { ProgressIndicator } from "./ProgressIndicator";
import { TypingIndicator } from "./TypingIndicator";
import { questions } from "@/data/questions";
import { DiagnosticData } from "@/types/diagnostic";
import pharmacistAvatar from "@/assets/pharmacist-avatar.jpg";
import { toast } from "@/hooks/use-toast";
import { calculateHydration } from "@/lib/hydrationCalculator";

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
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Display first question with typing indicator
    if (currentQuestionIndex === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage(questions[0].text);
          setShowInput(true);
        }, getTypingDelay(questions[0].text));
      }, 800);
    }
  }, []);

  // Calculate realistic typing delay based on message length
  const getTypingDelay = (message: string): number => {
    const baseDelay = 1000; // 1 second minimum
    const wordsPerMinute = 60;
    const words = message.split(' ').length;
    const typingTime = (words / wordsPerMinute) * 60 * 1000;
    // Random variation ±20%
    const variation = 0.8 + Math.random() * 0.4;
    return Math.min(baseDelay + (typingTime * variation), 4000); // Max 4 seconds
  };

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

  const handleAnswer = (answer: string | string[]) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Hide input immediately
    setShowInput(false);
    
    // Format answer for display
    const displayAnswer = Array.isArray(answer) ? answer.join(", ") : answer;
    
    // Add user message
    addUserMessage(displayAnswer);
    
    // Save answer
    const updatedData = {
      ...diagnosticData,
      [currentQuestion.id]: answer,
    };
    setDiagnosticData(updatedData);

    // Wait a bit before showing typing indicator
    setTimeout(() => {
      setIsTyping(true);
      
      // Find next question (skip conditional questions if needed)
      let nextIndex = currentQuestionIndex + 1;
      
      while (nextIndex < questions.length) {
        const nextQuestion = questions[nextIndex];
        
        // Check if question should be skipped based on conditional logic
        if (nextQuestion.conditional) {
          const dependsOnValue = updatedData[nextQuestion.conditional.dependsOn];
          if (dependsOnValue !== nextQuestion.conditional.value) {
            nextIndex++;
            continue;
          }
        }
        
        // Check if question should be skipped based on "No" answer
        if (nextQuestion.skipIfNo) {
          const skipValue = updatedData[nextQuestion.skipIfNo];
          if (skipValue === "Non") {
            nextIndex++;
            continue;
          }
        }
        
        break;
      }
      
      // Move to next question with realistic delay
      if (nextIndex < questions.length) {
        const nextQuestion = questions[nextIndex];
        const typingDelay = getTypingDelay(nextQuestion.text);
        
        setTimeout(() => {
          setIsTyping(false);
          setCurrentQuestionIndex(nextIndex);
          addBotMessage(nextQuestion.text);
          setShowInput(true);
        }, typingDelay);
      } else {
        // Complete - calculate results and show final message
        const results = calculateHydration(updatedData);
        
        const finalMessage = `Merci beaucoup pour tes réponses, ${updatedData.firstName || 'toi'} ! 💧\n\n**📊 Résultats de ton diagnostic d'hydratation**\n\n🎯 **Statut** : ${results.statut}\n📈 **Score d'hydratation** : ${results.score}/100\n\n💧 **Besoin en eau quotidien** : ${results.hydratation_jour_ml} mL/jour\n💊 **Recommandation Hydratis** : ${results.nb_pastilles} pastille${results.nb_pastilles > 1 ? 's' : ''} par jour\n\n**Détails métaboliques :**\n• Métabolisme basal : ${results.MB} kcal/jour\n• Dépense énergétique : ${results.DEJ} kcal/jour\n• Pertes hydriques totales : ${results.pertes_tot} mL/jour\n• Production d'eau métabolique : ${results.eau_metabo} mL/jour\n\nTu recevras bientôt des recommandations personnalisées par email à ${updatedData.email}. 💙`;
        
        const typingDelay = getTypingDelay(finalMessage);
        
        setTimeout(() => {
          setIsTyping(false);
          setIsComplete(true);
          addBotMessage(finalMessage);
          
          // Show success toast
          toast({
            title: "Diagnostic terminé !",
            description: `Score : ${results.score}/100 - ${results.statut}`,
          });
          
          // Log data (in production, send to backend)
          console.log("Diagnostic Data:", updatedData);
          console.log("Hydration Results:", results);
        }, typingDelay);
      }
    }, 600); // Small delay before showing typing indicator
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
        
        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}
        
        {/* Current Question Input/Options */}
        {!isComplete && showInput && currentQuestion && (
          <div className="pt-4">
            {currentQuestion.type === "options" && currentQuestion.options ? (
              <ChatOptions
                options={currentQuestion.options}
                onSelect={handleAnswer}
                multiColumn={currentQuestion.multiColumn}
              />
            ) : currentQuestion.type === "colorScale" ? (
              <ColorScaleSelector onSelect={handleAnswer} />
            ) : currentQuestion.type === "multiSelect" && currentQuestion.options ? (
              <MultiSelectOptions
                options={currentQuestion.options}
                onSubmit={handleAnswer}
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
