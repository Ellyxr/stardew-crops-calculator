// cropsDB.js
// minimal, extensible local DB. Add more fields as needed.
export const cropsDB = [
  // Fruits
  {
    id: "strawberry",
    name: "Strawberry",
    category: "fruit",
    basePrice: 120,
    notes: "Vanilla summer crop",
  },
  {
    id: "blueberry",
    name: "Blueberry",
    category: "fruit",
    basePrice: 50,
  },

  // Vegetables
  {
    id: "parsnip",
    name: "Parsnip",
    category: "vegetable",
    basePrice: 35,
  },
  {
    id: "tomato",
    name: "Tomato",
    category: "vegetable",
    basePrice: 60,
  },

  // Mushrooms / Forage
  {
    id: "morel",
    name: "Morel",
    category: "mushroom",
    basePrice: 150,
  },
  {
    id: "red_mushroom",
    name: "Red Mushroom",
    category: "mushroom",
    basePrice: 75,
  },

  // Example modded crop (you can add mod crops here)
  // { id: "tomberry", name: "Tomberry", category: "fruit", basePrice: 80, source: "mod:coolcrops" },
];