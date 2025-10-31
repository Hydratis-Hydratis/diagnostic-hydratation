import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ThematicScreen } from "./ThematicScreen";
import { ProgressIndicator } from "./ProgressIndicator";
import { TypingIndicator } from "./TypingIndicator";
import { ResultsDisplay } from "./ResultsDisplay";
import { questions } from "@/data/questions";
import { DiagnosticData, Question } from "@/types/diagnostic";
import pharmacistAvatar from "@/assets/pharmacist-avatar.jpg";
import { toast } from "@/hooks/use-toast";
import { calculateHydration } from "@/lib/hydrationCalculator";

// Group questions by step
const groupQuestionsByStep = (): { step: string; questions: Question[]; icon: string }[] => {
  const groups: { [key: string]: Question[] } = {};
  
  questions.forEach(q => {
    const step = q.step || "Informations";
    if (!groups[step]) groups[step] = [];
    groups[step].push(q);
  });
  
  const stepIcons: { [key: string]: string } = {
    "Profil": "👤",
    "Environnement": "🌡️",
    "Activité physique": "🏃",
    "Signaux cliniques": "🩺",
    "Habitudes": "☕",
  };
  
  return Object.entries(groups).map(([step, questions]) => ({
    step,
    questions,
    icon: stepIcons[step] || "📋"
  }));
};

const questionGroups = groupQuestionsByStep();

interface Message {
  text: string;
  isBot: boolean;
  timestamp: string;
  stepIndex?: number;
  answers?: Partial<DiagnosticData>;
}

export const DiagnosticChat = () => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScreen, setShowScreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Only scroll to bottom when a new bot message is added and screen is not showing
    if (messages.length > 0 && messages[messages.length - 1].isBot && !showScreen) {
      scrollToBottom();
    }
  }, [messages, showScreen]);

  useEffect(() => {
    // Display welcome message and first screen
    if (currentGroupIndex === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage("Bonjour ! Je suis ravie de t'aider avec ton diagnostic d'hydratation. 💧\n\nRéponds aux questions ci-dessous pour obtenir une évaluation personnalisée de tes besoins en hydratation.");
          setShowScreen(true);
        }, 2000);
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

  const createPersonalizedSummary = (answers: Partial<DiagnosticData>, stepIndex: number): string => {
    const stepName = questionGroups[stepIndex].step;
    
    // Créer un résumé personnalisé selon l'étape
    if (stepName === "Profil") {
      const sexe = answers.sexe === "Un homme" ? "un homme" : "une femme";
      const age = answers.age;
      const poids = answers.poids_kg;
      if (age && poids) {
        return `Super ! Tu es ${sexe} de ${age} ans pesant ${poids} kg.`;
      }
      return `Super ! Tes informations de profil sont enregistrées.`;
    } else if (stepName === "Environnement") {
      const temp = answers.temperature_ext;
      if (temp) {
        return `Noté ! Tu vis dans un environnement à ${temp}.`;
      }
      return "Noté ! Tes informations d'environnement sont enregistrées.";
    } else if (stepName === "Activité physique") {
      const sportPratique = answers.sport_pratique;
      if (sportPratique === "Oui") {
        const sports = answers.sports_selectionnes;
        if (sports && Array.isArray(sports)) {
          const sportNames = sports.map((s: any) => s.name).join(", ");
          return `Génial ! Tu pratiques : ${sportNames}. 💪`;
        }
        return "Parfait ! Tes informations sportives sont enregistrées.";
      }
      return "C'est noté, nous avons pris en compte ton niveau d'activité.";
    } else if (stepName === "Signaux cliniques") {
      const urine = answers.urine_couleur;
      if (urine && typeof urine === "number" && urine > 3) {
        return "Attention, ta couleur d'urine indique une déshydratation possible. 💧";
      }
      return "Merci pour ces informations précieuses sur ton hydratation actuelle.";
    } else if (stepName === "Habitudes") {
      return "Parfait ! J'ai toutes les informations sur tes habitudes de consommation. ☕";
    }
    
    return `✓ ${stepName} complété`;
  };

  const handleScreenSubmit = (answers: Partial<DiagnosticData>) => {
    // Hide screen immediately
    setShowScreen(false);
    
    // Save answers first
    const updatedData = {
      ...diagnosticData,
      ...answers,
    };
    setDiagnosticData(updatedData);
    
    // Create personalized summary message
    const summary = createPersonalizedSummary(answers, currentGroupIndex);
    
    // Add user message with step info and answers for edit functionality
    setMessages((prev) => [
      ...prev,
      {
        text: summary,
        isBot: false,
        timestamp: getCurrentTime(),
        stepIndex: currentGroupIndex,
        answers: answers,
      },
    ]);

    // Wait before showing next screen or results
    setTimeout(() => {
      setIsTyping(true);
      
      const nextGroupIndex = currentGroupIndex + 1;
      
      if (nextGroupIndex < questionGroups.length) {
        setTimeout(() => {
          setIsTyping(false);
          const nextGroup = questionGroups[nextGroupIndex];
          addBotMessage(`${nextGroup.icon} **${nextGroup.step}**\n\nContinuons avec quelques questions sur ce thème.`);
          setCurrentGroupIndex(nextGroupIndex);
          setShowScreen(true);
        }, 1500);
      } else {
        // Complete - calculate results
        const results = calculateHydration(updatedData);
        
        setTimeout(() => {
          setIsTyping(false);
          setIsComplete(true);
          
          // Show success toast
          toast({
            title: "Diagnostic terminé !",
            description: `Score : ${results.score}/100 - ${results.statut}`,
          });
          
          // Log data (in production, send to backend)
          console.log("Diagnostic Data:", updatedData);
          console.log("Hydration Results:", results);
        }, 2000);
      }
    }, 600);
  };

  const handleEditStep = (stepIndex: number) => {
    setCurrentGroupIndex(stepIndex);
    setShowScreen(true);
    setIsComplete(false);
  };

  const currentGroup = questionGroups[currentGroupIndex];
  const totalSteps = questionGroups.length;
  const results = isComplete ? calculateHydration(diagnosticData) : null;
  const stepNames = questionGroups.map(g => g.step);

  return (
    <div className="flex flex-col h-full">
      {/* Progress Indicator */}
      {!isComplete && messages.length > 0 && (
        <ProgressIndicator 
          current={currentGroupIndex} 
          total={totalSteps}
          steps={stepNames}
        />
      )}
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className="space-y-2">
            <ChatMessage
              message={message.text}
              isBot={message.isBot}
              avatar={message.isBot ? pharmacistAvatar : undefined}
              timestamp={message.timestamp}
            />
            {/* Bouton Modifier pour les réponses utilisateur */}
            {!message.isBot && message.stepIndex !== undefined && !isComplete && (
              <div className="flex justify-end px-2">
                <button
                  onClick={() => handleEditStep(message.stepIndex!)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors"
                >
                  <span>✏️</span>
                  <span>Modifier</span>
                </button>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}
        
        {/* Results Display */}
        {isComplete && results && (
          <div className="pt-4">
            <ResultsDisplay results={results} firstName={diagnosticData.firstName} />
          </div>
        )}
        
        {/* Current Thematic Screen */}
        {!isComplete && showScreen && currentGroup && (
          <div className="pt-4">
            <ThematicScreen
              questions={currentGroup.questions}
              stepName={`${currentGroup.icon} ${currentGroup.step}`}
              onSubmit={handleScreenSubmit}
              previousAnswers={diagnosticData}
            />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
