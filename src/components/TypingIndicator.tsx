import pharmacistAvatar from "@/assets/pharmacist-avatar.jpg";

export const TypingIndicator = () => {
  return (
    <div className="flex items-end gap-2 mb-4 animate-message-in will-change-transform">
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm animate-pulse-avatar">
        <img src={pharmacistAvatar} alt="Pharmacist" className="w-full h-full object-cover" />
      </div>
      
      <div className="flex flex-col items-start">
        <div className="px-4 py-3 rounded-3xl rounded-bl-sm bg-card text-card-foreground shadow-sm">
          <div className="flex gap-1.5 items-center h-5">
            <div 
              className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-dot-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-dot-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div 
              className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-dot-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
