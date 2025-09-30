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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-input border-border rounded-3xl px-4"
        autoFocus
      />
      <Button type="submit" variant="chat" size="icon" className="rounded-full flex-shrink-0">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};
