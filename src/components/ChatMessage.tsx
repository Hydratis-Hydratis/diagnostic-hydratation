import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  avatar?: string;
  timestamp?: string;
  animationDelay?: number;
}

export const ChatMessage = ({ 
  message, 
  isBot, 
  avatar, 
  timestamp,
  animationDelay = 0 
}: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex items-end gap-2 mb-4 will-change-transform",
        isBot 
          ? "justify-start animate-message-in" 
          : "justify-end animate-message-in-right"
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {isBot && avatar && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
          <img src={avatar} alt="Pharmacist" className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className={cn("flex flex-col", isBot ? "items-start" : "items-end")}>
        <div
          className={cn(
            "px-4 py-3 rounded-3xl max-w-[280px] sm:max-w-md shadow-sm",
            isBot
              ? "bg-card text-card-foreground rounded-bl-sm"
              : "bg-primary text-primary-foreground rounded-br-sm"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        {timestamp && (
          <span className="text-xs mt-1 px-2" style={{ color: 'hsl(var(--chat-timestamp))' }}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
};
