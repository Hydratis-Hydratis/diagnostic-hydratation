import { useState } from "react";
import { Thermometer, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TemperatureSelectorProps {
  onSelect: (value: string) => void;
}

export const TemperatureSelector = ({ onSelect }: TemperatureSelectorProps) => {
  const [selectedTemp, setSelectedTemp] = useState<string>("");

  const temperatureRanges = [
    { value: "< 10°C", label: "< 10°C", color: "from-blue-400 to-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/20", borderColor: "border-blue-500" },
    { value: "10-18°C", label: "10-18°C", color: "from-cyan-400 to-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950/20", borderColor: "border-cyan-500" },
    { value: "18-28°C", label: "18-28°C", color: "from-yellow-400 to-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950/20", borderColor: "border-yellow-500" },
    { value: "> 28°C", label: "> 28°C", color: "from-red-400 to-red-600", bgColor: "bg-red-50 dark:bg-red-950/20", borderColor: "border-red-500" }
  ];

  const handleSelect = (value: string) => {
    setSelectedTemp(value);
    onSelect(value);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Quelle est la température extérieure habituelle ?</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                La température influence vos besoins en eau : plus il fait chaud, 
                plus les pertes hydriques augmentent par sudation.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {temperatureRanges.map((temp) => (
          <button
            key={temp.value}
            type="button"
            onClick={() => handleSelect(temp.value)}
            className={cn(
              "relative p-4 rounded-lg border-2 transition-all duration-200",
              "hover:scale-105 active:scale-95",
              selectedTemp === temp.value
                ? `${temp.borderColor} ${temp.bgColor} shadow-lg`
                : "border-border bg-card hover:bg-accent/50"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "p-2 rounded-full",
                selectedTemp === temp.value ? `bg-gradient-to-br ${temp.color}` : "bg-muted"
              )}>
                <Thermometer className={cn(
                  "w-6 h-6",
                  selectedTemp === temp.value ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              <span className={cn(
                "text-sm font-medium",
                selectedTemp === temp.value ? "text-foreground" : "text-muted-foreground"
              )}>
                {temp.label}
              </span>
            </div>
            {selectedTemp === temp.value && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
