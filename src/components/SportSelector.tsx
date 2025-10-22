import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface Sport {
  name: string;
  category: string;
  coefficient: number;
}

interface SportSelectorProps {
  onSelect: (sports: Sport[]) => void;
}

const sportsData: Sport[] = [
  // Endurance continue
  { name: "Course à pied", category: "Endurance continue", coefficient: 1.0 },
  { name: "Cyclisme", category: "Endurance continue", coefficient: 1.0 },
  { name: "Marche rapide", category: "Endurance continue", coefficient: 1.0 },
  { name: "Vélo d'appartement", category: "Endurance continue", coefficient: 1.0 },
  { name: "Rameur", category: "Endurance continue", coefficient: 1.0 },
  { name: "Trail", category: "Endurance continue", coefficient: 1.0 },
  { name: "Marathon", category: "Endurance continue", coefficient: 1.0 },
  
  // Intermittent/collectif/HIIT
  { name: "HIIT", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "CrossFit", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Interval Training", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Tabata", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Circuit Training", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  
  // Musculation/Force
  { name: "Musculation", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Haltérophilie", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Powerlifting", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Renforcement musculaire", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Fitness", category: "Musculation/Force", coefficient: 0.6 },
  
  // Natation
  { name: "Natation", category: "Natation", coefficient: 0.8 },
  { name: "Aquagym", category: "Natation", coefficient: 0.8 },
  { name: "Water-polo", category: "Natation", coefficient: 0.8 },
  
  // Sports collectifs
  { name: "Football", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Basketball", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Handball", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Volleyball", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Rugby", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Tennis", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Badminton", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Squash", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Padel", category: "Sports collectifs", coefficient: 0.85 },
  
  // Yoga/Pilates/Stretching
  { name: "Yoga", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Pilates", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Stretching", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Tai Chi", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Méditation active", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
];

export const SportSelector = ({ onSelect }: SportSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);

  const filteredSports = sportsData.filter(sport =>
    sport.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSport = (sport: Sport) => {
    const isAlreadySelected = selectedSports.some(s => s.name === sport.name);
    let newSelection: Sport[];
    
    if (isAlreadySelected) {
      newSelection = selectedSports.filter(s => s.name !== sport.name);
    } else {
      newSelection = [...selectedSports, sport];
    }
    
    setSelectedSports(newSelection);
    onSelect(newSelection);
  };

  const handleRemoveSport = (sportName: string) => {
    const newSelection = selectedSports.filter(s => s.name !== sportName);
    setSelectedSports(newSelection);
    onSelect(newSelection);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un sport..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {selectedSports.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-xs font-medium text-muted-foreground w-full mb-1">
            Sports sélectionnés :
          </span>
          {selectedSports.map((sport) => (
            <Badge
              key={sport.name}
              variant="default"
              className="flex items-center gap-1 pr-1"
            >
              {sport.name}
              <button
                type="button"
                onClick={() => handleRemoveSport(sport.name)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto border rounded-lg">
        {filteredSports.length > 0 ? (
          <div className="divide-y">
            {filteredSports.map((sport) => {
              const isSelected = selectedSports.some(s => s.name === sport.name);
              return (
                <button
                  key={sport.name}
                  type="button"
                  onClick={() => handleSelectSport(sport)}
                  className={cn(
                    "w-full text-left p-3 transition-colors",
                    "hover:bg-accent/50",
                    isSelected && "bg-primary/10 border-l-4 border-primary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{sport.name}</p>
                      <p className="text-xs text-muted-foreground">{sport.category}</p>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Aucun sport trouvé
          </div>
        )}
      </div>
    </div>
  );
};

export type { Sport };
