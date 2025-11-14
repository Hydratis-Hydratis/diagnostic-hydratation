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
  // Endurance continue (11 sports)
  { name: "Course à pied", category: "Endurance continue", coefficient: 1.0 },
  { name: "Cyclisme", category: "Endurance continue", coefficient: 1.0 },
  { name: "Marche rapide", category: "Endurance continue", coefficient: 1.0 },
  { name: "Marche nordique", category: "Endurance continue", coefficient: 1.0 },
  { name: "Randonnée", category: "Endurance continue", coefficient: 1.0 },
  { name: "VTT", category: "Endurance continue", coefficient: 1.0 },
  { name: "Vélo d'appartement", category: "Endurance continue", coefficient: 1.0 },
  { name: "Vélo elliptique", category: "Endurance continue", coefficient: 1.0 },
  { name: "Rameur", category: "Endurance continue", coefficient: 1.0 },
  { name: "Triathlon", category: "Endurance continue", coefficient: 1.0 },
  { name: "Duathlon", category: "Endurance continue", coefficient: 1.0 },
  
  // Intermittent/collectif/HIIT (5 sports)
  { name: "HIIT", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "CrossFit", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Interval Training", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Circuit Training", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Boot Camp", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  
  // Musculation/Force (7 sports)
  { name: "Musculation", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Haltérophilie", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Powerlifting", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Renforcement musculaire", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Fitness", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Street Workout", category: "Musculation/Force", coefficient: 0.6 },
  { name: "TRX", category: "Musculation/Force", coefficient: 0.6 },
  
  // Natation et sports aquatiques (11 sports)
  { name: "Natation", category: "Natation", coefficient: 0.8 },
  { name: "Aquagym", category: "Natation", coefficient: 0.8 },
  { name: "Aquabike", category: "Natation", coefficient: 0.8 },
  { name: "Water-polo", category: "Natation", coefficient: 0.8 },
  { name: "Surf", category: "Natation", coefficient: 0.8 },
  { name: "Stand Up Paddle", category: "Natation", coefficient: 0.8 },
  { name: "Kayak", category: "Natation", coefficient: 0.8 },
  { name: "Aviron", category: "Natation", coefficient: 0.8 },
  { name: "Kitesurf", category: "Natation", coefficient: 0.8 },
  { name: "Planche à voile", category: "Natation", coefficient: 0.8 },
  { name: "Voile", category: "Natation", coefficient: 0.8 },
  
  // Sports collectifs (9 sports)
  { name: "Football", category: "Sports collectifs", coefficient: 0.9 },
  { name: "Basketball", category: "Sports collectifs", coefficient: 0.9 },
  { name: "Handball", category: "Sports collectifs", coefficient: 0.9 },
  { name: "Volleyball", category: "Sports collectifs", coefficient: 0.9 },
  { name: "Rugby", category: "Sports collectifs", coefficient: 0.9 },
  { name: "Hockey", category: "Sports collectifs", coefficient: 0.9 },
  { name: "Baseball", category: "Sports collectifs", coefficient: 0.9 },
  { name: "Softball", category: "Sports collectifs", coefficient: 0.9 },
  { name: "Ultimate Frisbee", category: "Sports collectifs", coefficient: 0.9 },
  
  // Sports de raquette (7 sports)
  { name: "Tennis", category: "Sports de raquette", coefficient: 0.9 },
  { name: "Badminton", category: "Sports de raquette", coefficient: 0.9 },
  { name: "Tennis de table", category: "Sports de raquette", coefficient: 0.9 },
  { name: "Squash", category: "Sports de raquette", coefficient: 0.9 },
  { name: "Padel", category: "Sports de raquette", coefficient: 0.9 },
  { name: "Pickleball", category: "Sports de raquette", coefficient: 0.9 },
  { name: "Racquetball", category: "Sports de raquette", coefficient: 0.9 },
  
  // Sports de combat (12 sports)
  { name: "Boxe anglaise", category: "Sports de combat", coefficient: 0.9 },
  { name: "Boxe française", category: "Sports de combat", coefficient: 0.9 },
  { name: "Kickboxing", category: "Sports de combat", coefficient: 0.9 },
  { name: "Muay Thai", category: "Sports de combat", coefficient: 0.9 },
  { name: "MMA", category: "Sports de combat", coefficient: 0.9 },
  { name: "Karaté", category: "Sports de combat", coefficient: 0.9 },
  { name: "Taekwondo", category: "Sports de combat", coefficient: 0.9 },
  { name: "Judo", category: "Sports de combat", coefficient: 0.9 },
  { name: "Jiu-jitsu brésilien", category: "Sports de combat", coefficient: 0.9 },
  { name: "Lutte", category: "Sports de combat", coefficient: 0.9 },
  { name: "Krav Maga", category: "Sports de combat", coefficient: 0.9 },
  { name: "Escrime", category: "Sports de combat", coefficient: 0.9 },
  
  // Sports de glisse et montagne (9 sports)
  { name: "Ski alpin", category: "Sports de glisse", coefficient: 0.9 },
  { name: "Ski de fond", category: "Sports de glisse", coefficient: 0.9 },
  { name: "Ski de randonnée", category: "Sports de glisse", coefficient: 0.9 },
  { name: "Snowboard", category: "Sports de glisse", coefficient: 0.9 },
  { name: "Patinage artistique", category: "Sports de glisse", coefficient: 0.9 },
  { name: "Patinage de vitesse", category: "Sports de glisse", coefficient: 0.9 },
  { name: "Roller", category: "Sports de glisse", coefficient: 0.9 },
  { name: "Skateboard", category: "Sports de glisse", coefficient: 0.9 },
  { name: "Alpinisme", category: "Sports de glisse", coefficient: 0.9 },
  
  // Danse (6 sports)
  { name: "Danse classique", category: "Danse", coefficient: 0.7 },
  { name: "Danse contemporaine", category: "Danse", coefficient: 0.7 },
  { name: "Salsa", category: "Danse", coefficient: 0.7 },
  { name: "Bachata", category: "Danse", coefficient: 0.7 },
  { name: "Hip-hop", category: "Danse", coefficient: 0.7 },
  { name: "Zumba", category: "Danse", coefficient: 0.7 },
  
  // Yoga et bien-être (5 sports)
  { name: "Yoga Vinyasa", category: "Yoga et bien-être", coefficient: 0.4 },
  { name: "Yoga Ashtanga", category: "Yoga et bien-être", coefficient: 0.4 },
  { name: "Yoga Bikram", category: "Yoga et bien-être", coefficient: 0.4 },
  { name: "Pilates", category: "Yoga et bien-être", coefficient: 0.4 },
  { name: "Stretching", category: "Yoga et bien-être", coefficient: 0.4 },
  
  // Athlétisme (7 sports)
  { name: "Sprint", category: "Athlétisme", coefficient: 0.9 },
  { name: "Demi-fond", category: "Athlétisme", coefficient: 1.0 },
  { name: "Fond", category: "Athlétisme", coefficient: 1.0 },
  { name: "Saut en hauteur", category: "Athlétisme", coefficient: 0.6 },
  { name: "Saut en longueur", category: "Athlétisme", coefficient: 0.6 },
  { name: "Lancer de poids", category: "Athlétisme", coefficient: 0.6 },
  { name: "Lancer de javelot", category: "Athlétisme", coefficient: 0.6 },
  
  // Sports acrobatiques (5 sports)
  { name: "Gymnastique artistique", category: "Sports acrobatiques", coefficient: 0.7 },
  { name: "Gymnastique rythmique", category: "Sports acrobatiques", coefficient: 0.7 },
  { name: "Trampoline", category: "Sports acrobatiques", coefficient: 0.7 },
  { name: "Parkour", category: "Sports acrobatiques", coefficient: 0.9 },
  { name: "Cheerleading", category: "Sports acrobatiques", coefficient: 0.7 },
  
  // Sports équestres et autres (6 sports)
  { name: "Équitation", category: "Sports équestres", coefficient: 0.6 },
  { name: "Golf", category: "Sports de précision", coefficient: 0.5 },
  { name: "Tir à l'arc", category: "Sports de précision", coefficient: 0.4 },
  { name: "Escalade", category: "Sports de grimpe", coefficient: 0.8 },
  { name: "Motocross", category: "Sports mécaniques", coefficient: 0.7 },
  { name: "Quad", category: "Sports mécaniques", coefficient: 0.7 },
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
                    <p className="font-medium text-sm">{sport.name}</p>
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
