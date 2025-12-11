import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { ThematicScreen } from "./ThematicScreen";
import { TypingIndicator } from "./TypingIndicator";
import { ResultsDisplay } from "./ResultsDisplay";
import { OnboardingScreen } from "./OnboardingScreen";
import { LoadingDroplet } from "./LoadingDroplet";
import { questions } from "@/data/questions";
import { DiagnosticData, Question } from "@/types/diagnostic";
import pharmacistAvatar from "@/assets/pharmacist-avatar.jpg";
import { toast } from "@/hooks/use-toast";
import { calculateHydration } from "@/lib/hydrationCalculator";
import { saveDiagnosticToCloud } from "@/lib/saveDiagnostic";
import { ChevronDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Clés localStorage
const STORAGE_KEYS = {
  DIAGNOSTIC_DATA: 'hydratis_diagnostic_data',
  DIAGNOSTIC_STEP: 'hydratis_diagnostic_step',
  DIAGNOSTIC_RESULTS: 'hydratis_diagnostic_results',
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [pendingResumeData, setPendingResumeData] = useState<{ data: DiagnosticData; step: number } | null>(null);
  const [pendingScrollToScreen, setPendingScrollToScreen] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [pendingResults, setPendingResults] = useState<ReturnType<typeof calculateHydration> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const thematicScreenRef = useRef<HTMLDivElement>(null);

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

  // Scroll centralisé vers le ThematicScreen - positionne le message de transition visible en haut
  const scrollToThematicScreen = useCallback(() => {
    const container = containerRef.current;
    const target = thematicScreenRef.current;
    
    if (!container || !target || target.offsetHeight === 0) {
      console.log('[SCROLL] Target not ready, skipping');
      return;
    }
    
    // Trouver le dernier message bot (message de transition) pour scroller vers lui
    const messagesContainer = container.querySelector('[data-messages-container]');
    const allMessages = messagesContainer?.querySelectorAll('[data-message]');
    const lastBotMessage = allMessages?.[allMessages.length - 1] as HTMLElement;
    
    if (lastBotMessage) {
      // Scroller pour que le message de transition soit à ~20px du haut
      const containerRect = container.getBoundingClientRect();
      const messageRect = lastBotMessage.getBoundingClientRect();
      const relativeTop = messageRect.top - containerRect.top;
      
      // Offset fixe de 20px du haut du conteneur
      const newScrollTop = container.scrollTop + relativeTop - 20;
      
      container.scrollTo({
        top: Math.max(0, newScrollTop),
        behavior: 'smooth'
      });
    }
  }, []);

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


  // Fix: Ensure showScreen is true when we have a valid group and are not in typing/onboarding/transitioning state
  useEffect(() => {
    if (!showOnboarding && !isComplete && !isTyping && !isTransitioning && currentGroupIndex < questionGroups.length && !showScreen) {
      // Only auto-show screen if we have messages (meaning diagnostic has started)
      if (messages.length > 0) {
        setShowScreen(true);
      }
    }
  }, [showOnboarding, isComplete, isTyping, isTransitioning, currentGroupIndex, showScreen, messages.length]);

  useEffect(() => {
    // 1. Vérifier si des résultats complets existent (refresh sur page résultats)
    const savedResults = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_RESULTS);
    
    if (savedResults) {
      try {
        const { diagnosticData: savedDiagnosticData, results: savedResultsData } = JSON.parse(savedResults);
        setDiagnosticData(savedDiagnosticData);
        setIsComplete(true);
        setShowOnboarding(false);
        setCurrentGroupIndex(questionGroups.length); // Aller à la fin
        return; // Ne pas continuer
      } catch (error) {
        console.error("Erreur lors de la restauration des résultats:", error);
        localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_RESULTS);
      }
    }
    
    // 2. Vérifier si un diagnostic en cours existe
    const savedData = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
    const savedStep = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
    
    if (savedData && savedStep) {
      // Préparer les données pour le dialog
      try {
        const parsedData = JSON.parse(savedData);
        const parsedStep = parseInt(savedStep);
        setPendingResumeData({ data: parsedData, step: parsedStep });
        setShowResumeDialog(true);
      } catch (error) {
        console.error("Erreur lors de la restauration des données:", error);
        localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
        localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
      }
    }
    // 3. Si pas de données sauvegardées, l'onboarding s'affichera par défaut
  }, []);
  
  const startFreshDiagnostic = () => {
    if (currentGroupIndex === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage("Bonjour ! Pour te donner ton score d'hydratation et des recommandations personnalisées, voici quelques questions 💦");
          setShowScreen(true);
        }, 2000);
      }, 800);
    }
  };

  // Handlers pour le dialog de reprise
  const handleAcceptResume = () => {
    if (!pendingResumeData) return;
    
    setShowResumeDialog(false);
    setShowOnboarding(false);
    setDiagnosticData(pendingResumeData.data);
    setCurrentGroupIndex(pendingResumeData.step);
    setPendingResumeData(null);
    
    // Afficher message de reprise
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage("Bon retour ! Reprenons là où tu t'étais arrêté. 💧");
        setShowScreen(true);
      }, 1500);
    }, 500);
  };

  const handleDeclineResume = () => {
    // Nettoyer localStorage et retourner à l'accueil
    localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
    localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
    setShowResumeDialog(false);
    setPendingResumeData(null);
    setShowOnboarding(true); // Retour à la page d'accueil
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
        const dureeMinutes = answers.duree_minutes;
        const frequence = answers.frequence;
        const transpiration = answers.transpiration;
        
        if (sports && Array.isArray(sports)) {
          const sportNames = sports.map((s: any) => s.name).join(" et ");
          let message = `Je pratique ${sportNames}`;
          
          if (dureeMinutes && frequence) {
            message += ` avec des séances de ${dureeMinutes} min, ${frequence.toLowerCase()}`;
          } else if (dureeMinutes) {
            message += ` avec des séances de ${dureeMinutes} min`;
          } else if (frequence) {
            message += ` ${frequence.toLowerCase()}`;
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
    
    // Block useEffect during transition
    setIsTransitioning(true);
    
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

    // Show next screen immediately without typing delay
    const nextIndex = currentGroupIndex + 1;
    const transitionMessage = getTransitionMessage(nextIndex);
    
    if (nextIndex < questionGroups.length) {
      // Add bot message immediately
      addBotMessage(transitionMessage);
      setCurrentGroupIndex(nextIndex);
      
      // Show screen immediately
      setTimeout(() => {
        setShowScreen(true);
        setIsTransitioning(false);
        triggerHaptic('light');
        
        // Scroll fluide personnalisé vers le ThematicScreen
        setTimeout(() => {
          const container = containerRef.current;
          const target = thematicScreenRef.current;
          
          if (container && target) {
            const containerRect = container.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const relativeTop = targetRect.top - containerRect.top;
            
            // Positionner le ThematicScreen à ~180px du haut (laissant le message bleu visible)
            const targetScrollTop = Math.max(0, container.scrollTop + relativeTop - 180);
            const startScrollTop = container.scrollTop;
            const distance = targetScrollTop - startScrollTop;
            const duration = 600;
            let startTime: number | null = null;
            
            const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
            
            const animateScroll = (currentTime: number) => {
              if (!startTime) startTime = currentTime;
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easedProgress = easeOutCubic(progress);
              
              container.scrollTop = startScrollTop + (distance * easedProgress);
              
              if (progress < 1) {
                requestAnimationFrame(animateScroll);
              }
            };
            
            requestAnimationFrame(animateScroll);
          }
        }, 100);
      }, 50);
    } else {
      // Complete - calculate results
      const results = calculateHydration(updatedData);
      
      // Sauvegarder dans Lovable Cloud (anonyme, analytics + marketing)
      saveDiagnosticToCloud(updatedData, results).catch(err => {
        console.error('Erreur sauvegarde Cloud:', err);
        // Ne pas bloquer l'utilisateur en cas d'erreur
      });
      
      // Sauvegarder les résultats pour persistance après refresh navigateur
      localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC_RESULTS, JSON.stringify({
        diagnosticData: updatedData,
        results: results,
      }));
      
      // Nettoyer les clés de progression (plus nécessaires)
      localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
      localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
      
      // Show loading droplet animation
      setTimeout(() => {
        setIsTyping(false);
        setIsTransitioning(false);
        setPendingResults(results);
        setIsLoadingResults(true);
        triggerHaptic('light');
      }, 400);
    }
  };

  const handleEditStep = useCallback((stepIndex: number) => {
    setCurrentGroupIndex(stepIndex);
    setShowScreen(true);
    setIsComplete(false);
    setPendingScrollToScreen(true);
  }, []);

  const handleGoToStep = useCallback((stepIndex: number) => {
    // Naviguer vers une étape précédente en conservant les données
    setCurrentGroupIndex(stepIndex);
    setShowScreen(true);
    setIsComplete(false);
    setPendingScrollToScreen(true);
  }, []);

  const handleRestart = useCallback(() => {
    // La confirmation est gérée par le parent (Index.tsx)
    // Nettoyer TOUTES les clés localStorage (y compris les résultats)
    localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
    localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_STEP);
    localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC_RESULTS);
    
    setCurrentGroupIndex(0);
    setMessages([]);
    setDiagnosticData({});
    setIsComplete(false);
    setIsTyping(false);
    setShowScreen(false);
    setShowOnboarding(true);
  }, []);

  const handleStartDiagnostic = () => {
    setShowOnboarding(false);
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage("Bonjour ! Pour te donner ton score d'hydratation et des recommandations personnalisées, voici quelques questions 💦");
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
  }, [registerStepHandler, handleGoToStep]);

  // Register restart handler for parent to call
  useEffect(() => {
    registerRestartHandler?.(handleRestart);
  }, [registerRestartHandler, handleRestart]);

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
        {/* Messages uniquement pendant le diagnostic (masqués pendant chargement et résultats) */}
        {!isComplete && !isLoadingResults && (
          <div data-messages-container className="space-y-0">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2" data-message data-is-bot={message.isBot}>
                <ChatMessage
                  message={message.text}
                  isBot={message.isBot}
                  avatar={message.isBot ? pharmacistAvatar : undefined}
                  timestamp={message.timestamp}
                  animationDelay={index === messages.length - 1 ? 0 : undefined}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Typing Indicator */}
        {isTyping && !isLoadingResults && <TypingIndicator />}
        
        {/* Loading Droplet Animation */}
        {isLoadingResults && (
          <LoadingDroplet 
            onComplete={() => {
              setIsLoadingResults(false);
              setIsComplete(true);
              triggerHaptic('success');
              
              // Scroll to top for results
              if (containerRef.current) {
                containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
              
              if (pendingResults) {
                toast({
                  title: "Diagnostic terminé !",
                  description: `Score : ${pendingResults.score}/100 - ${pendingResults.statut}`,
                });
                console.log("Diagnostic Data:", diagnosticData);
                console.log("Hydration Results:", pendingResults);
              }
            }}
          />
        )}
        
        {/* Results Display */}
        {isComplete && results && (
          <div className="pt-4 animate-fade-in">
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
          <div ref={thematicScreenRef} className="pt-4 scroll-mt-4">
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

      {/* Dialog de reprise du diagnostic */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reprendre le diagnostic ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu as un diagnostic en cours. Veux-tu le reprendre là où tu t'étais arrêté ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeclineResume}>Non</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptResume}>Oui</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
