import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  multiColumn?: boolean;
}

export const ChatOptions = ({ options, onSelect, multiColumn = false }: ChatOptionsProps) => {
  return (
    <div className="mb-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs uppercase tracking-wide mb-3 px-2" style={{ color: 'hsl(var(--chat-timestamp))' }}>
        Choisis une option
      </p>
      <div
        className={cn(
          "flex flex-wrap gap-2",
          multiColumn && "grid grid-cols-2"
        )}
      >
        {options.map((option, index) => (
          <Button
            key={index}
            variant="chat"
            size="touch"
            onClick={() => onSelect(option)}
            className="flex-1 min-w-[120px] touch-manipulation active:scale-95"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};
