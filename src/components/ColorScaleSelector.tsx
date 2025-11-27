import { useState } from "react";
import { cn } from "@/lib/utils";

interface ColorScaleSelectorProps {
  value?: string;
  onSelect: (value: string) => void;
}

const colorOptions = [
  { label: "Très clair", value: "Très clair (bien hydraté)", color: "hsl(60, 80%, 95%)" },
  { label: "Clair", value: "Clair (hydraté)", color: "hsl(60, 80%, 88%)" },
  { label: "Jaune pâle", value: "Jaune pâle (hydraté)", color: "hsl(55, 85%, 75%)" },
  { label: "Jaune", value: "Jaune (légèrement déshydraté)", color: "hsl(52, 90%, 60%)" },
  { label: "Jaune foncé", value: "Jaune foncé (déshydraté)", color: "hsl(48, 95%, 50%)" },
  { label: "Ambre", value: "Ambre (déshydraté)", color: "hsl(45, 95%, 45%)" },
  { label: "Ambre foncé", value: "Ambre foncé (sévèrement déshydraté)", color: "hsl(42, 90%, 40%)" },
  { label: "Brun", value: "Brun (sévèrement déshydraté)", color: "hsl(50, 35%, 45%)" },
];

export const ColorScaleSelector = ({ value, onSelect }: ColorScaleSelectorProps) => {
  // Initialize with value if provided (value is 1-8, we need 0-7 for index)
  const initialIndex = value ? parseInt(value) - 1 : null;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(initialIndex);

  const handleSelect = (index: number, value: string) => {
    setSelectedIndex(index);
    // Envoyer l'index + 1 (pour avoir 1-8 au lieu de 0-7)
    onSelect(String(index + 1));
  };

  return (
    <div className="mb-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs uppercase tracking-wide mb-4 px-2" style={{ color: 'hsl(var(--chat-timestamp))' }}>
        Clique sur la couleur correspondante
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {colorOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index, option.value)}
            className={cn(
              "flex flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all duration-300 touch-manipulation",
              "hover:scale-105 hover:shadow-lg active:scale-90 active:opacity-90",
              selectedIndex === index && "ring-2 ring-primary ring-offset-2 scale-105"
            )}
          >
            <div
              className="w-full aspect-square min-h-[44px] rounded-lg sm:rounded-xl border-2 border-border/20 shadow-sm transition-all duration-300"
              style={{ backgroundColor: option.color }}
            />
            <span className="text-[9px] sm:text-[10px] text-center text-foreground/70 font-medium leading-tight">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
