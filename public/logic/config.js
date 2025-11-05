// config.js - Centralized configuration constants

export const GAME_CONSTANTS = {
  SEASON_LENGTH: 28,
  MALUS: 5,
  QUALITY_RATES: {
    normal: 0.97,
    silver: 0.02,
    gold: 0.01,
  },
  ARTISAN_MULTIPLIERS: {

  }
};
 
// --- minimal local crops DB // will be expanded later on ---
export const cropsDB = [
  { id: "strawberry", name: "Strawberry", category: "fruit", basePrice: 120 },
  { id: "blueberry", name: "Blueberry", category: "fruit", basePrice: 50 },
  { id: "cranberry", name: "Cranberry", category: "fruit", basePrice: 75 },
  { id: "parsnip", name: "Parsnip", category: "vegetable", basePrice: 35 },
  { id: "pumpkin", name: "Pumpkin", category: "vegetable", basePrice: 320 },
  { id: "tomato", name: "Tomato", category: "vegetable", basePrice: 60 },
  { id: "morel", name: "Morel", category: "mushroom", basePrice: 150 },
  { id: "red_mushroom", name: "Red Mushroom", category: "mushroom", basePrice: 75 },
];