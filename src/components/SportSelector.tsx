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
  { name: "Vélo elliptique", category: "Endurance continue", coefficient: 1.0 },
  { name: "Rameur", category: "Endurance continue", coefficient: 1.0 },
  { name: "Trail", category: "Endurance continue", coefficient: 1.0 },
  { name: "Marathon", category: "Endurance continue", coefficient: 1.0 },
  { name: "Semi-marathon", category: "Endurance continue", coefficient: 1.0 },
  { name: "Triathlon", category: "Endurance continue", coefficient: 1.0 },
  { name: "Duathlon", category: "Endurance continue", coefficient: 1.0 },
  { name: "Marche nordique", category: "Endurance continue", coefficient: 1.0 },
  { name: "Randonnée", category: "Endurance continue", coefficient: 1.0 },
  { name: "VTT", category: "Endurance continue", coefficient: 1.0 },
  { name: "Cyclisme sur route", category: "Endurance continue", coefficient: 1.0 },
  { name: "Spinning", category: "Endurance continue", coefficient: 1.0 },
  
  // Intermittent/collectif/HIIT
  { name: "HIIT", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "CrossFit", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Interval Training", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Tabata", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Circuit Training", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Boot Camp", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  { name: "Functional Training", category: "Intermittent/collectif/HIIT", coefficient: 0.9 },
  
  // Musculation/Force
  { name: "Musculation", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Haltérophilie", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Powerlifting", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Renforcement musculaire", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Fitness", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Bodybuilding", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Street Workout", category: "Musculation/Force", coefficient: 0.6 },
  { name: "Calisthenics", category: "Musculation/Force", coefficient: 0.6 },
  { name: "TRX", category: "Musculation/Force", coefficient: 0.6 },
  
  // Natation et sports aquatiques
  { name: "Natation", category: "Natation", coefficient: 0.8 },
  { name: "Natation synchronisée", category: "Natation", coefficient: 0.8 },
  { name: "Aquagym", category: "Natation", coefficient: 0.8 },
  { name: "Aquabike", category: "Natation", coefficient: 0.8 },
  { name: "Water-polo", category: "Natation", coefficient: 0.8 },
  { name: "Plongeon", category: "Natation", coefficient: 0.8 },
  { name: "Surf", category: "Natation", coefficient: 0.8 },
  { name: "Bodyboard", category: "Natation", coefficient: 0.8 },
  { name: "Stand Up Paddle", category: "Natation", coefficient: 0.8 },
  { name: "Kayak", category: "Natation", coefficient: 0.8 },
  { name: "Canoë", category: "Natation", coefficient: 0.8 },
  { name: "Aviron", category: "Natation", coefficient: 0.8 },
  { name: "Kitesurf", category: "Natation", coefficient: 0.8 },
  { name: "Windsurf", category: "Natation", coefficient: 0.8 },
  { name: "Planche à voile", category: "Natation", coefficient: 0.8 },
  { name: "Voile", category: "Natation", coefficient: 0.8 },
  { name: "Ski nautique", category: "Natation", coefficient: 0.8 },
  { name: "Wakeboard", category: "Natation", coefficient: 0.8 },
  { name: "Plongée sous-marine", category: "Natation", coefficient: 0.8 },
  
  // Sports collectifs
  { name: "Football", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Football américain", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Futsal", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Basketball", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Handball", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Volleyball", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Beach-volley", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Rugby", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Rugby à 7", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Hockey sur gazon", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Hockey sur glace", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Baseball", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Softball", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Cricket", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Ultimate Frisbee", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Lacrosse", category: "Sports collectifs", coefficient: 0.85 },
  { name: "Polo", category: "Sports collectifs", coefficient: 0.85 },
  
  // Sports de raquette
  { name: "Tennis", category: "Sports de raquette", coefficient: 0.85 },
  { name: "Tennis de table", category: "Sports de raquette", coefficient: 0.85 },
  { name: "Badminton", category: "Sports de raquette", coefficient: 0.85 },
  { name: "Squash", category: "Sports de raquette", coefficient: 0.85 },
  { name: "Padel", category: "Sports de raquette", coefficient: 0.85 },
  { name: "Pickleball", category: "Sports de raquette", coefficient: 0.85 },
  { name: "Racquetball", category: "Sports de raquette", coefficient: 0.85 },
  
  // Sports de combat
  { name: "Boxe anglaise", category: "Sports de combat", coefficient: 0.9 },
  { name: "Boxe française", category: "Sports de combat", coefficient: 0.9 },
  { name: "Kickboxing", category: "Sports de combat", coefficient: 0.9 },
  { name: "MMA", category: "Sports de combat", coefficient: 0.9 },
  { name: "Muay Thai", category: "Sports de combat", coefficient: 0.9 },
  { name: "Karaté", category: "Sports de combat", coefficient: 0.9 },
  { name: "Judo", category: "Sports de combat", coefficient: 0.9 },
  { name: "Jiu-jitsu brésilien", category: "Sports de combat", coefficient: 0.9 },
  { name: "Taekwondo", category: "Sports de combat", coefficient: 0.9 },
  { name: "Aïkido", category: "Sports de combat", coefficient: 0.9 },
  { name: "Krav Maga", category: "Sports de combat", coefficient: 0.9 },
  { name: "Lutte", category: "Sports de combat", coefficient: 0.9 },
  { name: "Escrime", category: "Sports de combat", coefficient: 0.9 },
  { name: "Kendo", category: "Sports de combat", coefficient: 0.9 },
  { name: "Capoeira", category: "Sports de combat", coefficient: 0.9 },
  
  // Sports d'hiver
  { name: "Ski alpin", category: "Sports d'hiver", coefficient: 0.85 },
  { name: "Ski de fond", category: "Sports d'hiver", coefficient: 1.0 },
  { name: "Ski de randonnée", category: "Sports d'hiver", coefficient: 1.0 },
  { name: "Snowboard", category: "Sports d'hiver", coefficient: 0.85 },
  { name: "Raquettes à neige", category: "Sports d'hiver", coefficient: 1.0 },
  { name: "Patinage artistique", category: "Sports d'hiver", coefficient: 0.85 },
  { name: "Patinage de vitesse", category: "Sports d'hiver", coefficient: 1.0 },
  { name: "Curling", category: "Sports d'hiver", coefficient: 0.6 },
  { name: "Bobsleigh", category: "Sports d'hiver", coefficient: 0.85 },
  { name: "Luge", category: "Sports d'hiver", coefficient: 0.85 },
  { name: "Biathlon", category: "Sports d'hiver", coefficient: 1.0 },
  
  // Danse et gymnastique
  { name: "Danse classique", category: "Danse", coefficient: 0.7 },
  { name: "Danse contemporaine", category: "Danse", coefficient: 0.7 },
  { name: "Danse de salon", category: "Danse", coefficient: 0.7 },
  { name: "Salsa", category: "Danse", coefficient: 0.7 },
  { name: "Bachata", category: "Danse", coefficient: 0.7 },
  { name: "Kizomba", category: "Danse", coefficient: 0.7 },
  { name: "Tango", category: "Danse", coefficient: 0.7 },
  { name: "Hip-hop", category: "Danse", coefficient: 0.7 },
  { name: "Breakdance", category: "Danse", coefficient: 0.9 },
  { name: "Zumba", category: "Danse", coefficient: 0.7 },
  { name: "Pole dance", category: "Danse", coefficient: 0.8 },
  { name: "Gymnastique artistique", category: "Gymnastique", coefficient: 0.8 },
  { name: "Gymnastique rythmique", category: "Gymnastique", coefficient: 0.8 },
  { name: "Trampoline", category: "Gymnastique", coefficient: 0.8 },
  { name: "Acrosport", category: "Gymnastique", coefficient: 0.8 },
  { name: "Cheerleading", category: "Gymnastique", coefficient: 0.8 },
  
  // Sports de précision
  { name: "Tir à l'arc", category: "Précision", coefficient: 0.5 },
  { name: "Tir sportif", category: "Précision", coefficient: 0.5 },
  { name: "Golf", category: "Précision", coefficient: 0.6 },
  { name: "Pétanque", category: "Précision", coefficient: 0.5 },
  { name: "Bowling", category: "Précision", coefficient: 0.5 },
  { name: "Fléchettes", category: "Précision", coefficient: 0.5 },
  { name: "Billard", category: "Précision", coefficient: 0.5 },
  
  // Sports équestres
  { name: "Équitation", category: "Sports équestres", coefficient: 0.7 },
  { name: "Dressage", category: "Sports équestres", coefficient: 0.7 },
  { name: "Saut d'obstacles", category: "Sports équestres", coefficient: 0.7 },
  { name: "Cross", category: "Sports équestres", coefficient: 0.7 },
  { name: "Endurance équestre", category: "Sports équestres", coefficient: 0.8 },
  { name: "Polo équestre", category: "Sports équestres", coefficient: 0.8 },
  
  // Sports extrêmes
  { name: "Escalade", category: "Sports extrêmes", coefficient: 0.8 },
  { name: "Alpinisme", category: "Sports extrêmes", coefficient: 0.9 },
  { name: "Via ferrata", category: "Sports extrêmes", coefficient: 0.8 },
  { name: "Parkour", category: "Sports extrêmes", coefficient: 0.9 },
  { name: "Skateboard", category: "Sports extrêmes", coefficient: 0.7 },
  { name: "Roller", category: "Sports extrêmes", coefficient: 0.7 },
  { name: "BMX", category: "Sports extrêmes", coefficient: 0.8 },
  { name: "Parachutisme", category: "Sports extrêmes", coefficient: 0.7 },
  { name: "Parapente", category: "Sports extrêmes", coefficient: 0.7 },
  { name: "Base jump", category: "Sports extrêmes", coefficient: 0.7 },
  { name: "Deltaplane", category: "Sports extrêmes", coefficient: 0.7 },
  { name: "Canyoning", category: "Sports extrêmes", coefficient: 0.9 },
  { name: "Rafting", category: "Sports extrêmes", coefficient: 0.9 },
  
  // Sports motorisés
  { name: "Karting", category: "Sports motorisés", coefficient: 0.6 },
  { name: "Motocross", category: "Sports motorisés", coefficient: 0.7 },
  { name: "Rallye", category: "Sports motorisés", coefficient: 0.6 },
  { name: "Course automobile", category: "Sports motorisés", coefficient: 0.6 },
  { name: "Jet ski", category: "Sports motorisés", coefficient: 0.7 },
  
  // Yoga/Pilates/Stretching
  { name: "Yoga", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Hatha Yoga", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Vinyasa Yoga", category: "Yoga/Pilates/Stretching", coefficient: 0.6 },
  { name: "Ashtanga Yoga", category: "Yoga/Pilates/Stretching", coefficient: 0.6 },
  { name: "Bikram Yoga", category: "Yoga/Pilates/Stretching", coefficient: 0.7 },
  { name: "Yin Yoga", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Power Yoga", category: "Yoga/Pilates/Stretching", coefficient: 0.6 },
  { name: "Pilates", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Stretching", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Tai Chi", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Qi Gong", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Méditation active", category: "Yoga/Pilates/Stretching", coefficient: 0.5 },
  { name: "Barre au sol", category: "Yoga/Pilates/Stretching", coefficient: 0.6 },
  
  // Autres sports
  { name: "Athlétisme", category: "Autres", coefficient: 0.9 },
  { name: "Décathlon", category: "Autres", coefficient: 0.9 },
  { name: "Heptathlon", category: "Autres", coefficient: 0.9 },
  { name: "Saut en hauteur", category: "Autres", coefficient: 0.8 },
  { name: "Saut en longueur", category: "Autres", coefficient: 0.8 },
  { name: "Lancer de poids", category: "Autres", coefficient: 0.7 },
  { name: "Lancer de javelot", category: "Autres", coefficient: 0.7 },
  { name: "Lancer de disque", category: "Autres", coefficient: 0.7 },
  { name: "Lancer de marteau", category: "Autres", coefficient: 0.7 },
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
