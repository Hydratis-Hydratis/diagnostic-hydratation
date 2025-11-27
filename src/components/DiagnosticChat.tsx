import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { ThematicScreen } from "./ThematicScreen";
import { TypingIndicator } from "./TypingIndicator";
import { ResultsDisplay } from "./ResultsDisplay";
import { OnboardingScreen } from "./OnboardingScreen";
import { questions } from "@/data/questions";
import { DiagnosticData, Question } from "@/types/diagnostic";
import pharmacistAvatar from "@/assets/pharmacist-avatar.jpg";
import { toast } from "@/hooks/use-toast";
import { calculateHydration } from "@/lib/hydrationCalculator";
import { saveDiagnosticToCloud } from "@/lib/saveDiagnostic";
import { ChevronDown } from "lucide-react";

// Clés localStorage
const STORAGE_KEYS = {
  DIAGNOSTIC_DATA: 'hydratis_diagnostic_data',
  DIAGNOSTIC_STEP: 'hydratis_diagnostic_step',
};

// Haptic feedback utility
const triggerHaptic = (style: 'light' | 'medium' | 'success' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [15],
      success: [10, 50, 10]
    };
    navigator.vibrate(patterns[style]);
  }
};

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

interface DiagnosticChatProps {
  onProgressChange?: (progress: {
    current: number;
    total: number;
    steps: string[];
    isComplete: boolean;
    showOnboarding: boolean;
  }) => void;
  registerStepHandler?: (handler: (stepIndex: number) => void) => void;
  registerRestartHandler?: (handler: () => void) => void;
}

export const DiagnosticChat = ({ 
  onProgressChange, 
  registerStepHandler,
  registerRestartHandler 
}: DiagnosticChatProps) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScreen, setShowScreen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smart scroll detection
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((smooth = true, force = false) => {
    if (!force && !isAtBottom) {
      setHasNewMessages(true);
      return;
    }
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? "smooth" : "auto",
      block: "end"
    });
    setHasNewMessages(false);
  }, [isAtBottom]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom) setHasNewMessages(false);
  }, [checkIfAtBottom]);

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to let animation start
      const timer = setTimeout(() => scrollToBottom(true, false), 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

  // Auto-scroll when typing indicator appears
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => scrollToBottom(true, true), 50);
      return () => clearTimeout(timer);
    }
  }, [isTyping, scrollToBottom]);

  useEffect(() => {
    // Vérifier si des données sauvegardées existent
    const savedData = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
    const savedStep = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
    
    if (savedData && savedStep) {
      // Skip l'onboarding si diagnostic en cours
      setShowOnboarding(false);
      
      // Demander si l'utilisateur veut reprendre
      const shouldResume = window.confirm(
        "Tu as un diagnostic en cours. Veux-tu le reprendre ?"
      );
      
      if (shouldResume) {
        // Restaurer les données
        try {
          const parsedData = JSON.parse(savedData);
          const parsedStep = parseInt(savedStep);
          
          setDiagnosticData(parsedData);
          setCurrentGroupIndex(parsedStep);
          
          // Afficher message de reprise
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              addBotMessage("Bon retour ! Reprenons là où tu t'étais arrêté. 💧");
              setShowScreen(true);
            }, 1500);
          }, 500);
        } catch (error) {
          console.error("Erreur lors de la restauration des données:", error);
          localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
          localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
          startFreshDiagnostic();
        }
      } else {
        // Nettoyer localStorage et démarrer un nouveau diagnostic
        localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
        localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
        startFreshDiagnostic();
      }
    }
    // Si pas de données sauvegardées, l'onboarding s'affichera par défaut
  }, []);
  
  const startFreshDiagnostic = () => {
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
  };

  // Calculate realistic typing delay based on message length (optimized for UX)
  const getTypingDelay = (message: string): number => {
    const baseDelay = 800; // 800ms minimum
    const wordsPerMinute = 120; // Faster typing simulation
    const words = message.split(' ').length;
    const typingTime = (words / wordsPerMinute) * 60 * 1000;
    // Random variation ±15%
    const variation = 0.85 + Math.random() * 0.3;
    return Math.min(Math.max(baseDelay, baseDelay + (typingTime * variation)), 2500); // Max 2.5 seconds
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

  // Get transition message for next step
  const getTransitionMessage = (nextIndex: number): string => {
    if (nextIndex >= questionGroups.length) return "";
    const nextGroup = questionGroups[nextIndex];
    const transitionMessages: { [key: string]: string } = {
      "Activité physique": "C'est noté 🙂 Passons maintenant à l'activité physique !",
      "Santé & Conditions": "Super, c'est noté ! 💪 Parlons maintenant de ta santé.",
      "Habitudes": "Parfait ! ☕ Passons à tes habitudes quotidiennes.",
      "Informations": "On y est presque ! 📋 Plus que quelques informations."
    };
    return transitionMessages[nextGroup.step] || `${nextGroup.icon} ${nextGroup.step}\n\nPassons maintenant à la suite.`;
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
      return "Je ne pratique pas de sport et je n'ai pas de métier physique 🙂";
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
    // Trigger haptic feedback on submit
    triggerHaptic('medium');
    
    // Hide screen immediately
    setShowScreen(false);
    
    // Save answers first
    const updatedData = {
      ...diagnosticData,
      ...answers,
    };
    setDiagnosticData(updatedData);
    
    // Sauvegarder dans localStorage
    const nextGroupIndex = currentGroupIndex + 1;
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC_DATA, JSON.stringify(updatedData));
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC_STEP, nextGroupIndex.toString());
    
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

    // Wait before showing next screen or results (shorter delay)
    setTimeout(() => {
      setIsTyping(true);
      
      const nextIndex = currentGroupIndex + 1;
      const transitionMessage = getTransitionMessage(nextIndex);
      const typingDuration = getTypingDelay(transitionMessage);
      
      if (nextIndex < questionGroups.length) {
        setTimeout(() => {
          setIsTyping(false);
          const nextGroup = questionGroups[nextIndex];
          
          addBotMessage(transitionMessage);
          setCurrentGroupIndex(nextIndex);
          
          // Small delay before showing screen for smooth transition
          setTimeout(() => {
            setShowScreen(true);
            triggerHaptic('light');
          }, 150);
        }, typingDuration);
      } else {
        // Complete - calculate results
        const results = calculateHydration(updatedData);
        
        // Sauvegarder dans Lovable Cloud (anonyme, analytics + marketing)
        saveDiagnosticToCloud(updatedData, results).catch(err => {
          console.error('Erreur sauvegarde Cloud:', err);
          // Ne pas bloquer l'utilisateur en cas d'erreur
        });
        
        // Nettoyer localStorage une fois le diagnostic terminé
        localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
        localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
        
        setTimeout(() => {
          setIsTyping(false);
          setIsComplete(true);
          triggerHaptic('success');
          
          // Show success toast
          toast({
            title: "Diagnostic terminé !",
            description: `Score : ${results.score}/100 - ${results.statut}`,
          });
          
          // Log data (in production, send to backend)
          console.log("Diagnostic Data:", updatedData);
          console.log("Hydration Results:", results);
        }, 1500);
      }
    }, 400);
  };

  const handleEditStep = (stepIndex: number) => {
    setCurrentGroupIndex(stepIndex);
    setShowScreen(true);
    setIsComplete(false);
  };

  const handleGoToStep = (stepIndex: number) => {
    // Naviguer vers une étape précédente en conservant les données
    setCurrentGroupIndex(stepIndex);
    setShowScreen(true);
    setIsComplete(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestart = () => {
    const confirmRestart = window.confirm(
      "Es-tu sûr de vouloir recommencer le diagnostic ? Toutes tes réponses seront perdues."
    );
    
    if (!confirmRestart) return;
    
    // Nettoyer localStorage
    localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
    localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
    
    setCurrentGroupIndex(0);
    setMessages([]);
    setDiagnosticData({});
    setIsComplete(false);
    setIsTyping(false);
    setShowScreen(false);
    setShowOnboarding(true);
  };

  const handleStartDiagnostic = () => {
    setShowOnboarding(false);
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage("Bonjour ! Réponds à quelques questions pour que je t'aide à mieux comprendre tes besoins d'hydratation. 💧");
        setShowScreen(true);
      }, 2000);
    }, 800);
  };

  const currentGroup = questionGroups[currentGroupIndex];
  const totalSteps = questionGroups.length;
  const results = isComplete ? calculateHydration(diagnosticData) : null;
  const stepNames = questionGroups.map(g => g.step);

  // Expose progress state to parent
  useEffect(() => {
    onProgressChange?.({
      current: currentGroupIndex,
      total: totalSteps,
      steps: stepNames,
      isComplete,
      showOnboarding,
    });
  }, [currentGroupIndex, totalSteps, isComplete, showOnboarding, onProgressChange]);

  // Register step handler for parent to call
  useEffect(() => {
    registerStepHandler?.(handleGoToStep);
  }, [registerStepHandler]);

  // Register restart handler for parent to call
  useEffect(() => {
    registerRestartHandler?.(handleRestart);
  }, [registerRestartHandler]);

  return (
    <div className="flex flex-col h-full">
      {/* Onboarding Screen */}
      {showOnboarding && (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <OnboardingScreen onStart={handleStartDiagnostic} />
        </div>
      )}

      {/* Progress indicator is now in the header */}
      
      {/* Messages Container */}
      {!showOnboarding && (
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth-chat"
          onScroll={handleScroll}
        >
        {messages.map((message, index) => (
          <div key={index} className="space-y-2">
            <ChatMessage
              message={message.text}
              isBot={message.isBot}
              avatar={message.isBot ? pharmacistAvatar : undefined}
              timestamp={message.timestamp}
              animationDelay={index === messages.length - 1 ? 0 : undefined}
            />
            {/* Bouton Modifier pour les réponses utilisateur */}
            {!message.isBot && message.stepIndex !== undefined && !isComplete && (
              <div className="flex justify-end px-2">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    handleEditStep(message.stepIndex!);
                  }}
                  className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors touch-manipulation"
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
        
        {/* New messages indicator */}
        {hasNewMessages && !isAtBottom && (
          <button
            onClick={() => {
              triggerHaptic('light');
              scrollToBottom(true, true);
            }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm animate-message-in touch-manipulation z-50"
          >
            <ChevronDown className="w-4 h-4" />
            Nouveaux messages
          </button>
        )}
        </div>
      )}
    </div>
  );
};
