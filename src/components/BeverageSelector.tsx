import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import waterIcon from "@/assets/beverages/water.svg";
import sodaIcon from "@/assets/beverages/soda.svg";
import sodaZeroIcon from "@/assets/beverages/soda-zero.svg";
import juiceIcon from "@/assets/beverages/juice.svg";
import coffeeSweetIcon from "@/assets/beverages/coffee-sweet.svg";
import coffeeIcon from "@/assets/beverages/coffee.svg";
import wineIcon from "@/assets/beverages/wine.svg";
import beerIcon from "@/assets/beverages/beer.svg";
import sportsDrinkIcon from "@/assets/beverages/sports-drink.svg";
import energyDrinkIcon from "@/assets/beverages/energy-drink.svg";
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
import hydratisIcon from "@/assets/beverages/hydratis.svg";
const beverages: BeverageItem[] = [{
  id: "eau",
  label: "Verre d'eau",
  volume: "25cl",
  icon: waterIcon
}, {
  id: "hydratis",
  label: "Verre d'Hydratis",
  volume: "25cl",
  icon: hydratisIcon
}, {
  id: "soda",
  label: "Soda",
  volume: "33cl",
  icon: sodaIcon
}, {
  id: "soda_zero",
  label: "Soda 0%",
  volume: "33cl",
  icon: sodaZeroIcon
}, {
  id: "cafe_the",
  label: "Café ou thé",
  volume: "12.5cl",
  icon: coffeeIcon
}, {
  id: "cafe_sucre",
  label: "Café ou thé sucré",
  volume: "12.5cl",
  icon: coffeeSweetIcon
}, {
  id: "jus",
  label: "Jus de fruit",
  volume: "25cl",
  icon: juiceIcon
}, {
  id: "boisson_energisante",
  label: "Boisson énergisante",
  volume: "25cl",
  icon: energyDrinkIcon
}, {
  id: "vin",
  label: "Vin",
  volume: "12.5cl",
  icon: wineIcon
}, {
  id: "biere",
  label: "Bière",
  volume: "25cl",
  icon: beerIcon
}, {
  id: "boisson_sport",
  label: "Boisson pour le sport",
  volume: "50cl",
  icon: sportsDrinkIcon
}];
interface BeverageSelectorProps {
  quantities: BeverageQuantities;
  onChange: (quantities: BeverageQuantities) => void;
}
export const BeverageSelector = ({
  quantities,
  onChange
}: BeverageSelectorProps) => {
  const handleIncrement = (id: keyof BeverageQuantities) => {
    onChange({
      ...quantities,
      [id]: quantities[id] + 1
    });
  };
  const handleDecrement = (id: keyof BeverageQuantities) => {
    if (quantities[id] > 0) {
      onChange({
        ...quantities,
        [id]: quantities[id] - 1
      });
    }
  };
  return <div className="w-full">
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {beverages.map(beverage => <div key={beverage.id} className="flex flex-col items-center p-3 sm:p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-center mb-2 sm:mb-3 min-h-[2rem] sm:min-h-[2.5rem] flex items-center justify-center px-1">
              <span>{beverage.label} <span className="text-muted-foreground">({beverage.volume})</span></span>
            </div>
            <div className="flex-1 flex items-center justify-center w-full mb-2 sm:mb-4">
              <img src={beverage.icon} alt={beverage.label} className="w-16 h-16 sm:w-24 sm:h-24 object-contain" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full justify-center">
              <Button type="button" variant="outline" size="icon" className="h-9 w-9 sm:h-12 sm:w-12 rounded-full touch-target touch-active touch-manipulation" onClick={() => handleDecrement(beverage.id)} disabled={quantities[beverage.id] === 0}>
                <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <span className="text-lg sm:text-xl font-semibold min-w-[1.5rem] sm:min-w-[2.5rem] text-center">
                {quantities[beverage.id]}
              </span>
              <Button type="button" variant="default" size="icon" className="h-9 w-9 sm:h-12 sm:w-12 rounded-full touch-target touch-active touch-manipulation" onClick={() => handleIncrement(beverage.id)}>
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>)}
      </div>
    </div>;
};