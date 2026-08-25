import {
  Armchair,
  Brush,
  CakeSlice,
  Candy,
  Cookie,
  Cpu,
  CupSoda,
  Droplets,
  Dumbbell,
  Flame,
  Laptop,
  Lamp,
  Milk,
  PackageSearch,
  PawPrint,
  PenTool,
  Plane,
  Popcorn,
  Shirt,
  ShoppingBasket,
  ShowerHead,
  Smartphone,
  Snowflake,
  SprayCan,
  ToyBrick,
  UtensilsCrossed,
  Wrench,
  Apple,
} from "lucide-react";

/**
 * One icon per category slug, picked to actually match the category rather
 * than cycled arbitrarily. Every entry here must stay unique -- the point is
 * that a customer scanning the strip can tell categories apart at a glance.
 */
const CATEGORY_ICONS = {
  beverages: CupSoda,
  "biscuits-and-cookies": Cookie,
  chocolate: Candy,
  "cleaners-and-repellents": SprayCan,
  "computers-and-laptops": Laptop,
  "dairy-and-eggs": Milk,
  electronics: Cpu,
  fashion: Shirt,
  "frozen-food": Snowflake,
  "fruits-vegetables": Apple,
  furnitures: Armchair,
  "groceries-and-staples": ShoppingBasket,
  hardware: Wrench,
  "home-decorations": Lamp,
  "household-care": Brush,
  "kitchen-and-dining": UtensilsCrossed,
  "oils-and-ghee": Droplets,
  "personal-care": ShowerHead,
  "pet-and-food": PawPrint,
  "puja-and-essentials": Flame,
  smartphones: Smartphone,
  "snacks-and-packaged-food": Popcorn,
  "sports-and-fitness": Dumbbell,
  stationary: PenTool,
  "sweet-corner": CakeSlice,
  toys: ToyBrick,
  travel: Plane,
};

/** Falls back to a generic search icon for any category not in the map above. */
export function getCategoryIcon(slug) {
  return CATEGORY_ICONS[slug] ?? PackageSearch;
}
