
export interface BottleModel {
  id: string;
  name: string;
  modelKey: string;
  iconLibrary: "MaterialCommunityIcons" | "Ionicons";
  iconName: string;
  description: string;
}

export const BOTTLE_MODELS: BottleModel[] = [
  {
    id: "water-bottle",
    name: "Vattenflaska",
    modelKey: "waterBottle",
    iconLibrary: "MaterialCommunityIcons",
    iconName: "bottle-soda-classic-outline",
    description: "Klassisk vattenflaska",
  },
  {
    id: "glass-bottle",
    name: "Glasflaska",
    modelKey: "glassBottle",
    iconLibrary: "MaterialCommunityIcons",
    iconName: "bottle-wine-outline",
    description: "Transparent glasflaska",
  },
  {
    id: "sport-bottle",
    name: "Sportflaska",
    modelKey: "sportBottle",
    iconLibrary: "MaterialCommunityIcons",
    iconName: "cup-water",
    description: "Modern sportflaska",
  },
  {
    id: "thermos",
    name: "Termos",
    modelKey: "thermos",
    iconLibrary: "MaterialCommunityIcons",
    iconName: "bottle-tonic-outline",
    description: "Isolerad termos",
  },
  {
    id: "coffee-mug",
    name: "Kaffekopp",
    modelKey: "coffeeMug",
    iconLibrary: "MaterialCommunityIcons",
    iconName: "coffee-outline",
    description: "Kaffekopp eller temugg",
  },
];

export function getBottleModel(modelId: string): BottleModel {
  return BOTTLE_MODELS.find((m) => m.id === modelId) || BOTTLE_MODELS[0];
}
