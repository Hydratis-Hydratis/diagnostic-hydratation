import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ThematicScreen } from "./ThematicScreen";
import { ProgressIndicator } from "./ProgressIndicator";
import { TypingIndicator } from "./TypingIndicator";
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
    scrollToBottom();
  }, [messages]);

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

  const handleScreenSubmit = (answers: Partial<DiagnosticData>) => {
    // Hide screen immediately
    setShowScreen(false);
    
    // Create summary message
    const answersArray = Object.entries(answers).map(([key, value]) => {
      if (key === 'boissons_journalieres' && typeof value === 'object') {
        const quantities = value as Record<string, number>;
        const total = Object.values(quantities).reduce((sum: number, qty: number) => sum + qty, 0);
        return `${total} verre${total > 1 ? 's' : ''} de boissons`;
      }
      return Array.isArray(value) ? value.join(", ") : String(value);
    });
    
    addUserMessage(`✓ ${questionGroups[currentGroupIndex].step} complété`);
    
    // Save answers
    const updatedData = {
      ...diagnosticData,
      ...answers,
    };
    setDiagnosticData(updatedData);

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
        // Complete - calculate results and show final message
        const results = calculateHydration(updatedData);
        
        const notesText = results.notes.length > 0 
          ? `\n\n**📋 Notes importantes :**\n${results.notes.map(note => `• ${note}`).join('\n')}`
          : '';
        
        // Comparaison hydratation réelle vs besoins
        const hydratationComparaison = results.hydratation_reelle_ml > 0
          ? `\n\n**💦 Hydratation actuelle vs Besoins :**\n• Hydratation réelle : **${results.hydratation_reelle_ml} mL/jour** (${Math.round(results.hydratation_reelle_ml / 250)} verres)\n• Besoins totaux : **${results.besoin_total_ml} mL/jour**\n• Écart : ${results.ecart_hydratation_ml > 0 ? `**+${results.ecart_hydratation_ml} mL manquants**` : `**${Math.abs(results.ecart_hydratation_ml)} mL en excès**`}`
          : '';
        
        // Construction du message pour les besoins exercice
        const exerciceSection = results.besoins_exercice_ml > 0
          ? `\n\n**🏃 Besoins pendant l'exercice physique :**\n• Volume d'eau recommandé : **${results.besoins_exercice_ml} mL** par séance\n• Pertes par transpiration : ${results.details_exercice.pertes_transpiration} mL/kg/h\n• Facteur sport : ${results.details_exercice.facteur_sport}\n• Durée d'effort : ${results.details_exercice.duree_heures}h\n• Ajustement température : +${results.details_exercice.ajust_temperature} mL/h\n• Pastilles Hydratis : **${results.nb_pastilles_exercice}** pendant l'effort + **${results.nb_pastilles_post_exercice}** après l'effort`
          : '';
        
        const totalPastilles = results.nb_pastilles_basal + results.nb_pastilles_exercice + results.nb_pastilles_post_exercice;
        
        const finalMessage = `Merci beaucoup pour tes réponses, ${updatedData.firstName || 'toi'} ! 💧\n\n**📊 Résultats de ton diagnostic d'hydratation**\n\n🎯 **Statut** : ${results.statut}\n📈 **Score d'hydratation** : ${results.score}/100\n\n**💧 Besoins hydriques quotidiens (hors exercice) :**\n• Volume d'eau recommandé : **${results.besoins_basals_ml} mL/jour**\n• Détails : Base ${results.details_basals.base_age_sexe} mL + ajustements (température +${results.details_basals.ajust_temperature} mL, boissons +${results.details_basals.ajust_boissons} mL, physiologique +${results.details_basals.ajust_physiologique} mL, symptômes +${results.details_basals.ajust_symptomes} mL)${exerciceSection}\n\n**📊 BESOIN TOTAL QUOTIDIEN : ${results.besoin_total_ml} mL/jour**${hydratationComparaison}\n\n**💊 Recommandations Pastilles Hydratis :**\n• Quotidien : **${results.nb_pastilles_basal}** pastilles/jour${results.besoins_exercice_ml > 0 ? `\n• Pendant l'effort : **${results.nb_pastilles_exercice}** pastilles\n• Récupération post-effort : **${results.nb_pastilles_post_exercice}** pastille\n• **Total recommandé : ${totalPastilles} pastilles/jour**` : ''}${notesText}\n\nTu recevras bientôt des recommandations personnalisées par email à ${updatedData.email}. 💙`;
        
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
        }, 2000);
      }
    }, 600);
  };

  const currentGroup = questionGroups[currentGroupIndex];
  const totalSteps = questionGroups.length;

  return (
    <div className="flex flex-col h-full">
      {/* Progress Indicator */}
      {!isComplete && messages.length > 0 && (
        <ProgressIndicator current={currentGroupIndex} total={totalSteps} />
      )}
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
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
