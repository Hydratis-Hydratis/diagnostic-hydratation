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
  
  // Définir l'ordre exact des étapes
  const stepOrder = [
    "Profil",
    "Activité physique",
    "Santé & Conditions",
    "Habitudes",
    "Informations"
  ];
  
  const stepIcons: { [key: string]: string } = {
    "Profil": "👤",
    "Activité physique": "🏃",
    "Santé & Conditions": "🩺",
    "Habitudes": "☕",
    "Informations": "📋"
  };
  
  // Créer les groupes dans l'ordre défini
  return stepOrder
    .filter(step => groups[step]) // Garder seulement les étapes qui existent
    .map(step => ({
      step,
      questions: groups[step],
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
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    // Only scroll to bottom when there are multiple messages and screen is not showing
    // Don't scroll on the initial welcome message
    if (messages.length > 2 && messages[messages.length - 1].isBot && !showScreen) {
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
          addBotMessage("Bonjour ! Réponds à quelques questions pour que je t'aide à mieux comprendre tes besoins d'hydratation. 💧");
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
      const taille = answers.taille_cm;
      
      if (age && poids && taille) {
        return `Je suis ${sexe} de ${age} ans, je mesure ${taille} cm et pèse ${poids} kg 👌`;
      } else if (age && poids) {
        return `Je suis ${sexe} de ${age} ans et pèse ${poids} kg 👌`;
      }
      return `Mes informations de profil sont enregistrées.`;
    } else if (stepName === "Environnement") {
      return "Température extérieure notée 🌡️";
    } else if (stepName === "Activité physique") {
      const sportPratique = answers.sport_pratique;
      const metierPhysique = answers.metier_physique;
      
      if (sportPratique === "Oui") {
        const sports = answers.sports_selectionnes;
        const duree_hebdo = answers.duree_seance; // durée hebdomadaire totale
        const transpiration = answers.transpiration;
        
        if (sports && Array.isArray(sports)) {
          const sportNames = sports.map((s: any) => s.name).join(" et ");
          let message = `Je pratique ${sportNames}`;
          
          if (duree_hebdo) {
            message += ` avec un volume de ${duree_hebdo} par semaine`;
          }
          
          if (transpiration) {
            message += ` et une transpiration de ${transpiration}/10`;
          }
          
          if (metierPhysique === "Oui") {
            message += `. J'ai également un métier physique`;
          }
          
          message += " 💪";
          return message;
        }
        return "Mes informations sportives sont enregistrées.";
      }
      
      // Cas sans sport
      if (metierPhysique === "Oui") {
        return "Je ne pratique pas de sport mais j'ai un métier physique 💼";
      }
      return "Je ne pratique pas de sport régulièrement.";
    } else if (stepName === "Santé & Conditions") {
      const couleurUrine = answers.urine_couleur;
      const temperature = answers.temperature_ext;
      const crampes = answers.crampes;
      const courbatures = answers.courbatures;
      
      const phrases = [];
      
      if (temperature) {
        phrases.push(`La température extérieure est de ${temperature}`);
      }
      
      if (couleurUrine) {
        phrases.push(`ma couleur d'urine est au niveau ${couleurUrine}/8`);
      }
      
      if (crampes === "Oui") {
        phrases.push("je ressens des crampes");
      } else if (crampes === "Non") {
        phrases.push("je ne ressens pas de crampes");
      }
      
      if (courbatures === "Oui") {
        phrases.push("j'ai des courbatures");
      }
      
      if (phrases.length > 0) {
        // Construire une phrase avec virgules et "et" avant le dernier élément
        let message = phrases[0];
        if (phrases.length > 1) {
          message = phrases.slice(0, -1).join(", ");
          message += " et " + phrases[phrases.length - 1];
        }
        return message + " 🩺";
      }
      
      return "Mes informations de santé sont enregistrées 🩺";
    } else if (stepName === "Habitudes") {
      return "J'ai complété mes boissons quotidiennes habituelles ☕";
    } else if (stepName === "Informations") {
      return "J'ai complété mes informations pour recevoir mes résultats 📋";
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
          
          // Message personnalisé selon l'étape
          let transitionMessage = `${nextGroup.icon} ${nextGroup.step}\n\nPassons maintenant à la suite.`;
          if (nextGroup.step === "Activité physique") {
            transitionMessage = "C'est noté 🙂 Passons maintenant à l'activité physique !";
          }
          
          addBotMessage(transitionMessage);
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

  const handleRestart = () => {
    setCurrentGroupIndex(0);
    setMessages([]);
    setDiagnosticData({});
    setIsComplete(false);
    setIsTyping(true);
    setShowScreen(false);
    
    // Relancer le message de bienvenue après un délai
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage("Bonjour ! Réponds à quelques questions pour que je t'aide à mieux comprendre tes besoins d'hydratation. 💧");
      setShowScreen(true);
    }, 1500);
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
            <ResultsDisplay 
              results={results} 
              diagnosticData={diagnosticData}
              firstName={diagnosticData.firstName} 
              onRestart={handleRestart} 
            />
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
