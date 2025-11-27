import { useState } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface TranspirationScaleProps {
  value?: string;
  onSelect: (value: string) => void;
}

export const TranspirationScale = ({ value, onSelect }: TranspirationScaleProps) => {
  // Initialize with value if provided
  const initialValue = value ? parseInt(value) : 5;
  const [selectedValue, setSelectedValue] = useState<number>(initialValue);

  const transpirationLabels: Record<number, string> = {
    0: "Pas du tout (peau sèche)",
    1: "Très peu (front légèrement humide)",
    2: "Peu (front et tempes humides)",
    3: "Un peu (visage humide)",
    4: "Modéré (visage et nuque humides)",
    5: "Moyen (aisselles humides)",
    6: "Assez (aisselles et dos humides)",
    7: "Beaucoup (dos trempé)",
    8: "Très beaucoup (vêtements humides)",
    9: "Énormément (vêtements trempés)",
    10: "Extrême (ruisselant de sueur)",
  };

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
        <div className="flex flex-col items-center mb-6 gap-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary">
            <span className="text-2xl font-bold text-primary">{selectedValue}</span>
          </div>
          <span className="text-sm font-medium text-foreground">{transpirationLabels[selectedValue]}</span>
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
