import { useState } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface TranspirationScaleProps {
  onSelect: (value: string) => void;
}

export const TranspirationScale = ({ onSelect }: TranspirationScaleProps) => {
  const [selectedValue, setSelectedValue] = useState<number>(5);

  const handleValueChange = (value: number[]) => {
    setSelectedValue(value[0]);
    onSelect(value[0].toString());
  };

  return (
    <div className="mb-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs uppercase tracking-wide mb-4 px-2" style={{ color: 'hsl(var(--chat-timestamp))' }}>
        Sélectionne ton niveau de transpiration
      </p>
      
      <div className="px-4 py-6">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary">
            <span className="text-2xl font-bold text-primary">{selectedValue}</span>
          </div>
        </div>
        
        <Slider
          min={0}
          max={10}
          step={1}
          value={[selectedValue]}
          onValueChange={handleValueChange}
          className="w-full"
        />
        
        <div className="flex justify-between mt-4 px-1">
          <span className="text-xs text-muted-foreground">Pas du tout</span>
          <span className="text-xs text-muted-foreground">Énormément</span>
        </div>
      </div>
    </div>
  );
};
