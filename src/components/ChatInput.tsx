import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "number";
}

export const ChatInput = ({ onSubmit, placeholder = "Votre réponse...", type = "text" }: ChatInputProps) => {
  const [value, setValue] = useState("");
  const [emailError, setEmailError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = value.trim();
    
    if (!trimmedValue) return;
    
    // Validation email si type="email"
    if (type === "email") {
      const hasAt = trimmedValue.includes("@");
      const atIndex = trimmedValue.indexOf("@");
      const hasDotAfterAt = atIndex > 0 && trimmedValue.substring(atIndex).includes(".");
      
      if (!hasAt || !hasDotAfterAt) {
        // Afficher l'erreur et ne pas soumettre
        setEmailError(true);
        return;
      }
    }
    
    setEmailError(false);
    onSubmit(trimmedValue);
    setValue("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (emailError) setEmailError(false);
  };

  return (
    <div className="mb-4 px-2">
      <form onSubmit={handleSubmit} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`flex-1 bg-input border-border rounded-3xl px-4 ${emailError ? 'border-red-500 border-2' : ''}`}
          autoFocus
        />
        <Button type="submit" variant="chat" size="icon" className="rounded-full flex-shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {emailError && (
        <p className="text-red-500 text-sm mt-2 ml-2 animate-in fade-in slide-in-from-top-1">
          L'adresse email doit contenir un @ et un point (ex: ton.email@exemple.com)
        </p>
      )}
    </div>
  );
};
