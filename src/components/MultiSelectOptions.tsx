import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectOptionsProps {
  options: string[];
  onSubmit: (selected: string[]) => void;
}

export const MultiSelectOptions = ({ options, onSubmit }: MultiSelectOptionsProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelected(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onSubmit(selected);
    }
  };

  return (
    <div className="mb-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs uppercase tracking-wide mb-3 px-2" style={{ color: 'hsl(var(--chat-timestamp))' }}>
        Sélectionne une ou plusieurs options
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {options.map((option, index) => (
          <Button
            key={index}
            variant={selected.includes(option) ? "default" : "outline"}
            onClick={() => toggleOption(option)}
            className={cn(
              "relative justify-start h-auto py-3 px-4 text-left transition-all",
              selected.includes(option) && "ring-2 ring-primary ring-offset-1"
            )}
          >
            {selected.includes(option) && (
              <Check className="h-4 w-4 mr-2 flex-shrink-0" />
            )}
            <span className="flex-1">{option}</span>
          </Button>
        ))}
      </div>
      <Button 
        onClick={handleSubmit}
        disabled={selected.length === 0}
        variant="chat"
        className="w-full"
      >
        Valider ({selected.length} sélectionné{selected.length > 1 ? 's' : ''})
      </Button>
    </div>
  );
};
