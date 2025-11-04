import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import waterIcon from "@/assets/beverages/water.png";
import sodaIcon from "@/assets/beverages/soda.png";
import sodaZeroIcon from "@/assets/beverages/soda-zero.png";
import juiceIcon from "@/assets/beverages/juice.png";
import coffeeSweetIcon from "@/assets/beverages/coffee-sweet.png";
import coffeeIcon from "@/assets/beverages/coffee.png";
import wineIcon from "@/assets/beverages/wine.png";
import beerIcon from "@/assets/beverages/beer.png";
import sportsDrinkIcon from "@/assets/beverages/sports-drink.png";
import energyDrinkIcon from "@/assets/beverages/energy-drink.png";

export interface BeverageQuantities {
  eau: number;
  soda: number;
  soda_zero: number;
  jus: number;
  cafe_sucre: number;
  cafe_the: number;
  vin: number;
  biere: number;
  boisson_sport: number;
  boisson_energisante: number;
  hydratis: number;
}

interface BeverageItem {
  id: keyof BeverageQuantities;
  label: string;
  volume: string;
  icon: string;
}

import hydratisIcon from "@/assets/beverages/hydratis.png";

const beverages: BeverageItem[] = [
  { id: "eau", label: "Eau", volume: "25cl", icon: waterIcon },
  { id: "hydratis", label: "Verre d'Hydratis", volume: "25cl", icon: hydratisIcon },
  { id: "soda", label: "Soda", volume: "33cl", icon: sodaIcon },
  { id: "soda_zero", label: "Soda 0%", volume: "33cl", icon: sodaZeroIcon },
  { id: "jus", label: "Jus de fruit", volume: "25cl", icon: juiceIcon },
  { id: "cafe_sucre", label: "Café ou thé sucré", volume: "12.5cl", icon: coffeeSweetIcon },
  { id: "cafe_the", label: "Café ou thé", volume: "12.5cl", icon: coffeeIcon },
  { id: "vin", label: "Vin", volume: "12.5cl", icon: wineIcon },
  { id: "biere", label: "Bière", volume: "25cl", icon: beerIcon },
  { id: "boisson_sport", label: "Boisson pour le sport", volume: "50cl", icon: sportsDrinkIcon },
  { id: "boisson_energisante", label: "Boisson énergisante", volume: "25cl", icon: energyDrinkIcon },
];

interface BeverageSelectorProps {
  quantities: BeverageQuantities;
  onChange: (quantities: BeverageQuantities) => void;
}

export const BeverageSelector = ({ quantities, onChange }: BeverageSelectorProps) => {
  const handleIncrement = (id: keyof BeverageQuantities) => {
    onChange({
      ...quantities,
      [id]: quantities[id] + 1,
    });
  };

  const handleDecrement = (id: keyof BeverageQuantities) => {
    if (quantities[id] > 0) {
      onChange({
        ...quantities,
        [id]: quantities[id] - 1,
      });
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-4">Combien de verres consommez-vous ?</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {beverages.map((beverage) => (
          <div
            key={beverage.id}
            className="flex flex-col items-center p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
          >
            <div className="text-sm font-medium text-center mb-2">
              {beverage.label}
              <span className="text-muted-foreground ml-1">({beverage.volume})</span>
            </div>
            <img
              src={beverage.icon}
              alt={beverage.label}
              className="w-20 h-20 object-contain mb-3"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => handleDecrement(beverage.id)}
                disabled={quantities[beverage.id] === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[2rem] text-center">
                {quantities[beverage.id]}
              </span>
              <Button
                type="button"
                variant="default"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => handleIncrement(beverage.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
