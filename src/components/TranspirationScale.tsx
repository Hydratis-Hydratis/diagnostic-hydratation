import { useState } from "react";
import { cn } from "@/lib/utils";

interface TranspirationScaleProps {
  onSelect: (value: string) => void;
}

export const TranspirationScale = ({ onSelect }: TranspirationScaleProps) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    setTimeout(() => {
      onSelect(value.toString());
    }, 300);
  };

  return (
    <div className="mb-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs uppercase tracking-wide mb-4 px-2" style={{ color: 'hsl(var(--chat-timestamp))' }}>
        Sélectionne ton niveau de transpiration
      </p>
      <div className="grid grid-cols-11 gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              "hover:scale-105 hover:shadow-lg active:scale-95",
              selectedValue === value && "ring-2 ring-primary ring-offset-2 scale-105"
            )}
          >
            <div
              className={cn(
                "w-full aspect-square rounded-lg border-2 flex items-center justify-center font-bold transition-all duration-300",
                selectedValue === value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
              )}
            >
              {value}
            </div>
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 px-2">
        <span className="text-xs text-muted-foreground">Pas du tout</span>
        <span className="text-xs text-muted-foreground">Énormément</span>
      </div>
    </div>
  );
};
