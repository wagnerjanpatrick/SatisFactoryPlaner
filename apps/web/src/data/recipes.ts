import type { RecipeDefinition } from "./types";

export const RECIPES: RecipeDefinition[] = [
  // ============================================================
  // SMELTER RECIPES
  // ============================================================
  {
    id: "iron-ingot",
    name: "Iron Ingot",
    buildingId: "smelter",
    isAlternate: false,
    duration: 2,
    inputs: [
      { itemId: "iron-ore", amount: 1, perMinute: 30 },
    ],
    outputs: [
      { itemId: "iron-ingot", amount: 1, perMinute: 30 },
    ],
  },
  {
    id: "copper-ingot",
    name: "Copper Ingot",
    buildingId: "smelter",
    isAlternate: false,
    duration: 2,
    inputs: [
      { itemId: "copper-ore", amount: 1, perMinute: 30 },
    ],
    outputs: [
      { itemId: "copper-ingot", amount: 1, perMinute: 30 },
    ],
  },
  {
    id: "caterium-ingot",
    name: "Caterium Ingot",
    buildingId: "smelter",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "caterium-ore", amount: 3, perMinute: 45 },
    ],
    outputs: [
      { itemId: "caterium-ingot", amount: 1, perMinute: 15 },
    ],
  },

  // ============================================================
  // FOUNDRY RECIPES
  // ============================================================
  {
    id: "steel-ingot",
    name: "Steel Ingot",
    buildingId: "foundry",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "iron-ore", amount: 3, perMinute: 45 },
      { itemId: "coal", amount: 3, perMinute: 45 },
    ],
    outputs: [
      { itemId: "steel-ingot", amount: 3, perMinute: 45 },
    ],
  },
  {
    id: "aluminum-ingot",
    name: "Aluminum Ingot",
    buildingId: "foundry",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "aluminum-scrap", amount: 6, perMinute: 90 },
      { itemId: "silica", amount: 5, perMinute: 75 },
    ],
    outputs: [
      { itemId: "aluminum-ingot", amount: 4, perMinute: 60 },
    ],
  },

  // ============================================================
  // CONSTRUCTOR RECIPES
  // ============================================================
  {
    id: "iron-plate",
    name: "Iron Plate",
    buildingId: "constructor",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "iron-ingot", amount: 3, perMinute: 30 },
    ],
    outputs: [
      { itemId: "iron-plate", amount: 2, perMinute: 20 },
    ],
  },
  {
    id: "iron-rod",
    name: "Iron Rod",
    buildingId: "constructor",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "iron-ingot", amount: 1, perMinute: 15 },
    ],
    outputs: [
      { itemId: "iron-rod", amount: 1, perMinute: 15 },
    ],
  },
  {
    id: "screw",
    name: "Screw",
    buildingId: "constructor",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "iron-rod", amount: 1, perMinute: 10 },
    ],
    outputs: [
      { itemId: "screw", amount: 4, perMinute: 40 },
    ],
  },
  {
    id: "wire",
    name: "Wire",
    buildingId: "constructor",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "copper-ingot", amount: 1, perMinute: 15 },
    ],
    outputs: [
      { itemId: "wire", amount: 2, perMinute: 30 },
    ],
  },
  {
    id: "cable",
    name: "Cable",
    buildingId: "constructor",
    isAlternate: false,
    duration: 2,
    inputs: [
      { itemId: "wire", amount: 2, perMinute: 60 },
    ],
    outputs: [
      { itemId: "cable", amount: 1, perMinute: 30 },
    ],
  },
  {
    id: "concrete",
    name: "Concrete",
    buildingId: "constructor",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "limestone", amount: 3, perMinute: 45 },
    ],
    outputs: [
      { itemId: "concrete", amount: 1, perMinute: 15 },
    ],
  },
  {
    id: "copper-sheet",
    name: "Copper Sheet",
    buildingId: "constructor",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "copper-ingot", amount: 2, perMinute: 20 },
    ],
    outputs: [
      { itemId: "copper-sheet", amount: 1, perMinute: 10 },
    ],
  },
  {
    id: "steel-beam",
    name: "Steel Beam",
    buildingId: "constructor",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "steel-ingot", amount: 4, perMinute: 60 },
    ],
    outputs: [
      { itemId: "steel-beam", amount: 1, perMinute: 15 },
    ],
  },
  {
    id: "steel-pipe",
    name: "Steel Pipe",
    buildingId: "constructor",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "steel-ingot", amount: 3, perMinute: 30 },
    ],
    outputs: [
      { itemId: "steel-pipe", amount: 2, perMinute: 20 },
    ],
  },
  {
    id: "quartz-crystal",
    name: "Quartz Crystal",
    buildingId: "constructor",
    isAlternate: false,
    duration: 8,
    inputs: [
      { itemId: "raw-quartz", amount: 5, perMinute: 37.5 },
    ],
    outputs: [
      { itemId: "quartz-crystal", amount: 3, perMinute: 22.5 },
    ],
  },
  {
    id: "silica",
    name: "Silica",
    buildingId: "constructor",
    isAlternate: false,
    duration: 8,
    inputs: [
      { itemId: "raw-quartz", amount: 3, perMinute: 22.5 },
    ],
    outputs: [
      { itemId: "silica", amount: 5, perMinute: 37.5 },
    ],
  },
  {
    id: "quickwire",
    name: "Quickwire",
    buildingId: "constructor",
    isAlternate: false,
    duration: 5,
    inputs: [
      { itemId: "caterium-ingot", amount: 1, perMinute: 12 },
    ],
    outputs: [
      { itemId: "quickwire", amount: 5, perMinute: 60 },
    ],
  },
  {
    id: "empty-canister",
    name: "Empty Canister",
    buildingId: "constructor",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "plastic", amount: 2, perMinute: 30 },
    ],
    outputs: [
      { itemId: "empty-canister", amount: 4, perMinute: 60 },
    ],
  },
  {
    id: "aluminum-casing",
    name: "Aluminum Casing",
    buildingId: "constructor",
    isAlternate: false,
    duration: 2,
    inputs: [
      { itemId: "aluminum-ingot", amount: 3, perMinute: 90 },
    ],
    outputs: [
      { itemId: "aluminum-casing", amount: 2, perMinute: 60 },
    ],
  },
  {
    id: "iron-rebar",
    name: "Iron Rebar",
    buildingId: "constructor",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "iron-rod", amount: 1, perMinute: 15 },
    ],
    outputs: [
      { itemId: "iron-rebar", amount: 1, perMinute: 15 },
    ],
  },
  {
    id: "copper-powder",
    name: "Copper Powder",
    buildingId: "constructor",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "copper-ingot", amount: 30, perMinute: 300 },
    ],
    outputs: [
      { itemId: "copper-powder", amount: 5, perMinute: 50 },
    ],
  },

  // ============================================================
  // ASSEMBLER RECIPES
  // ============================================================
  {
    id: "reinforced-iron-plate",
    name: "Reinforced Iron Plate",
    buildingId: "assembler",
    isAlternate: false,
    duration: 12,
    inputs: [
      { itemId: "iron-plate", amount: 6, perMinute: 30 },
      { itemId: "screw", amount: 12, perMinute: 60 },
    ],
    outputs: [
      { itemId: "reinforced-iron-plate", amount: 1, perMinute: 5 },
    ],
  },
  {
    id: "modular-frame",
    name: "Modular Frame",
    buildingId: "assembler",
    isAlternate: false,
    duration: 60,
    inputs: [
      { itemId: "reinforced-iron-plate", amount: 3, perMinute: 3 },
      { itemId: "iron-rod", amount: 12, perMinute: 12 },
    ],
    outputs: [
      { itemId: "modular-frame", amount: 2, perMinute: 2 },
    ],
  },
  {
    id: "rotor",
    name: "Rotor",
    buildingId: "assembler",
    isAlternate: false,
    duration: 15,
    inputs: [
      { itemId: "iron-rod", amount: 5, perMinute: 20 },
      { itemId: "screw", amount: 25, perMinute: 100 },
    ],
    outputs: [
      { itemId: "rotor", amount: 1, perMinute: 4 },
    ],
  },
  {
    id: "stator",
    name: "Stator",
    buildingId: "assembler",
    isAlternate: false,
    duration: 12,
    inputs: [
      { itemId: "steel-pipe", amount: 3, perMinute: 15 },
      { itemId: "wire", amount: 8, perMinute: 40 },
    ],
    outputs: [
      { itemId: "stator", amount: 1, perMinute: 5 },
    ],
  },
  {
    id: "motor",
    name: "Motor",
    buildingId: "assembler",
    isAlternate: false,
    duration: 12,
    inputs: [
      { itemId: "rotor", amount: 2, perMinute: 10 },
      { itemId: "stator", amount: 2, perMinute: 10 },
    ],
    outputs: [
      { itemId: "motor", amount: 1, perMinute: 5 },
    ],
  },
  {
    id: "encased-industrial-beam",
    name: "Encased Industrial Beam",
    buildingId: "assembler",
    isAlternate: false,
    duration: 10,
    inputs: [
      { itemId: "steel-beam", amount: 3, perMinute: 18 },
      { itemId: "concrete", amount: 6, perMinute: 36 },
    ],
    outputs: [
      { itemId: "encased-industrial-beam", amount: 1, perMinute: 6 },
    ],
  },
  {
    id: "circuit-board",
    name: "Circuit Board",
    buildingId: "assembler",
    isAlternate: false,
    duration: 8,
    inputs: [
      { itemId: "copper-sheet", amount: 2, perMinute: 15 },
      { itemId: "plastic", amount: 4, perMinute: 30 },
    ],
    outputs: [
      { itemId: "circuit-board", amount: 1, perMinute: 7.5 },
    ],
  },
  {
    id: "ai-limiter",
    name: "AI Limiter",
    buildingId: "assembler",
    isAlternate: false,
    duration: 12,
    inputs: [
      { itemId: "copper-sheet", amount: 5, perMinute: 25 },
      { itemId: "quickwire", amount: 20, perMinute: 100 },
    ],
    outputs: [
      { itemId: "ai-limiter", amount: 1, perMinute: 5 },
    ],
  },
  {
    id: "black-powder",
    name: "Black Powder",
    buildingId: "assembler",
    isAlternate: false,
    duration: 4,
    inputs: [
      { itemId: "coal", amount: 1, perMinute: 15 },
      { itemId: "sulfur", amount: 1, perMinute: 15 },
    ],
    outputs: [
      { itemId: "black-powder", amount: 2, perMinute: 30 },
    ],
  },
  {
    id: "smart-plating",
    name: "Smart Plating",
    buildingId: "assembler",
    isAlternate: false,
    duration: 30,
    inputs: [
      { itemId: "reinforced-iron-plate", amount: 1, perMinute: 2 },
      { itemId: "rotor", amount: 1, perMinute: 2 },
    ],
    outputs: [
      { itemId: "smart-plating", amount: 1, perMinute: 2 },
    ],
  },
  {
    id: "automated-wiring",
    name: "Automated Wiring",
    buildingId: "assembler",
    isAlternate: false,
    duration: 24,
    inputs: [
      { itemId: "stator", amount: 1, perMinute: 2.5 },
      { itemId: "cable", amount: 20, perMinute: 50 },
    ],
    outputs: [
      { itemId: "automated-wiring", amount: 1, perMinute: 2.5 },
    ],
  },
  {
    id: "versatile-framework",
    name: "Versatile Framework",
    buildingId: "assembler",
    isAlternate: false,
    duration: 24,
    inputs: [
      { itemId: "modular-frame", amount: 1, perMinute: 2.5 },
      { itemId: "steel-beam", amount: 12, perMinute: 30 },
    ],
    outputs: [
      { itemId: "versatile-framework", amount: 2, perMinute: 5 },
    ],
  },
  {
    id: "alclad-aluminum-sheet",
    name: "Alclad Aluminum Sheet",
    buildingId: "assembler",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "aluminum-ingot", amount: 3, perMinute: 30 },
      { itemId: "copper-ingot", amount: 1, perMinute: 10 },
    ],
    outputs: [
      { itemId: "alclad-aluminum-sheet", amount: 3, perMinute: 30 },
    ],
  },
  {
    id: "heat-sink",
    name: "Heat Sink",
    buildingId: "assembler",
    isAlternate: false,
    duration: 8,
    inputs: [
      { itemId: "alclad-aluminum-sheet", amount: 5, perMinute: 37.5 },
      { itemId: "copper-sheet", amount: 3, perMinute: 22.5 },
    ],
    outputs: [
      { itemId: "heat-sink", amount: 1, perMinute: 7.5 },
    ],
  },
  {
    id: "electromagnetic-control-rod",
    name: "Electromagnetic Control Rod",
    buildingId: "assembler",
    isAlternate: false,
    duration: 30,
    inputs: [
      { itemId: "stator", amount: 3, perMinute: 6 },
      { itemId: "ai-limiter", amount: 2, perMinute: 4 },
    ],
    outputs: [
      { itemId: "electromagnetic-control-rod", amount: 2, perMinute: 4 },
    ],
  },

  // ============================================================
  // MANUFACTURER RECIPES
  // ============================================================
  {
    id: "heavy-modular-frame",
    name: "Heavy Modular Frame",
    buildingId: "manufacturer",
    isAlternate: false,
    duration: 30,
    inputs: [
      { itemId: "modular-frame", amount: 5, perMinute: 10 },
      { itemId: "steel-pipe", amount: 20, perMinute: 40 },
      { itemId: "encased-industrial-beam", amount: 5, perMinute: 10 },
      { itemId: "screw", amount: 120, perMinute: 240 },
    ],
    outputs: [
      { itemId: "heavy-modular-frame", amount: 1, perMinute: 2 },
    ],
  },
  {
    id: "computer",
    name: "Computer",
    buildingId: "manufacturer",
    isAlternate: false,
    duration: 24,
    inputs: [
      { itemId: "circuit-board", amount: 4, perMinute: 10 },
      { itemId: "cable", amount: 8, perMinute: 20 },
      { itemId: "plastic", amount: 16, perMinute: 40 },
    ],
    outputs: [
      { itemId: "computer", amount: 1, perMinute: 2.5 },
    ],
  },
  {
    id: "high-speed-connector",
    name: "High-Speed Connector",
    buildingId: "manufacturer",
    isAlternate: false,
    duration: 16,
    inputs: [
      { itemId: "quickwire", amount: 56, perMinute: 210 },
      { itemId: "cable", amount: 10, perMinute: 37.5 },
      { itemId: "circuit-board", amount: 1, perMinute: 3.75 },
    ],
    outputs: [
      { itemId: "high-speed-connector", amount: 1, perMinute: 3.75 },
    ],
  },
  {
    id: "crystal-oscillator",
    name: "Crystal Oscillator",
    buildingId: "manufacturer",
    isAlternate: false,
    duration: 120,
    inputs: [
      { itemId: "quartz-crystal", amount: 36, perMinute: 18 },
      { itemId: "cable", amount: 28, perMinute: 14 },
      { itemId: "reinforced-iron-plate", amount: 5, perMinute: 2.5 },
    ],
    outputs: [
      { itemId: "crystal-oscillator", amount: 2, perMinute: 1 },
    ],
  },
  {
    id: "supercomputer",
    name: "Supercomputer",
    buildingId: "manufacturer",
    isAlternate: false,
    duration: 32,
    inputs: [
      { itemId: "computer", amount: 4, perMinute: 7.5 },
      { itemId: "ai-limiter", amount: 2, perMinute: 3.75 },
      { itemId: "high-speed-connector", amount: 3, perMinute: 5.625 },
      { itemId: "plastic", amount: 28, perMinute: 52.5 },
    ],
    outputs: [
      { itemId: "supercomputer", amount: 1, perMinute: 1.875 },
    ],
  },
  {
    id: "adaptive-control-unit",
    name: "Adaptive Control Unit",
    buildingId: "manufacturer",
    isAlternate: false,
    duration: 60,
    inputs: [
      { itemId: "automated-wiring", amount: 5, perMinute: 5 },
      { itemId: "circuit-board", amount: 5, perMinute: 5 },
      { itemId: "heavy-modular-frame", amount: 1, perMinute: 1 },
      { itemId: "computer", amount: 2, perMinute: 2 },
    ],
    outputs: [
      { itemId: "adaptive-control-unit", amount: 1, perMinute: 1 },
    ],
  },
  {
    id: "modular-engine",
    name: "Modular Engine",
    buildingId: "manufacturer",
    isAlternate: false,
    duration: 60,
    inputs: [
      { itemId: "motor", amount: 2, perMinute: 2 },
      { itemId: "rubber", amount: 15, perMinute: 15 },
      { itemId: "smart-plating", amount: 2, perMinute: 2 },
    ],
    outputs: [
      { itemId: "modular-engine", amount: 1, perMinute: 1 },
    ],
  },

  // ============================================================
  // REFINERY RECIPES
  // ============================================================
  {
    id: "plastic",
    name: "Plastic",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "crude-oil", amount: 3, perMinute: 30 },
    ],
    outputs: [
      { itemId: "plastic", amount: 2, perMinute: 20 },
      { itemId: "heavy-oil-residue", amount: 1, perMinute: 10 },
    ],
  },
  {
    id: "rubber",
    name: "Rubber",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "crude-oil", amount: 3, perMinute: 30 },
    ],
    outputs: [
      { itemId: "rubber", amount: 2, perMinute: 20 },
      { itemId: "heavy-oil-residue", amount: 2, perMinute: 20 },
    ],
  },
  {
    id: "fuel",
    name: "Fuel",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "crude-oil", amount: 6, perMinute: 60 },
    ],
    outputs: [
      { itemId: "fuel", amount: 4, perMinute: 40 },
      { itemId: "polymer-resin", amount: 3, perMinute: 30 },
    ],
  },
  {
    id: "petroleum-coke",
    name: "Petroleum Coke",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "heavy-oil-residue", amount: 4, perMinute: 40 },
    ],
    outputs: [
      { itemId: "petroleum-coke", amount: 12, perMinute: 120 },
    ],
  },
  {
    id: "alumina-solution",
    name: "Alumina Solution",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "bauxite", amount: 12, perMinute: 120 },
      { itemId: "water", amount: 18, perMinute: 180 },
    ],
    outputs: [
      { itemId: "alumina-solution", amount: 12, perMinute: 120 },
      { itemId: "silica", amount: 5, perMinute: 50 },
    ],
  },
  {
    id: "aluminum-scrap",
    name: "Aluminum Scrap",
    buildingId: "refinery",
    isAlternate: false,
    duration: 1,
    inputs: [
      { itemId: "alumina-solution", amount: 4, perMinute: 240 },
      { itemId: "coal", amount: 2, perMinute: 120 },
    ],
    outputs: [
      { itemId: "aluminum-scrap", amount: 6, perMinute: 360 },
      { itemId: "water", amount: 2, perMinute: 120 },
    ],
  },
  {
    id: "residual-fuel",
    name: "Residual Fuel",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "heavy-oil-residue", amount: 6, perMinute: 60 },
    ],
    outputs: [
      { itemId: "fuel", amount: 4, perMinute: 40 },
    ],
  },
  {
    id: "residual-plastic",
    name: "Residual Plastic",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "polymer-resin", amount: 6, perMinute: 60 },
      { itemId: "water", amount: 2, perMinute: 20 },
    ],
    outputs: [
      { itemId: "plastic", amount: 2, perMinute: 20 },
    ],
  },
  {
    id: "residual-rubber",
    name: "Residual Rubber",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "polymer-resin", amount: 4, perMinute: 40 },
      { itemId: "water", amount: 4, perMinute: 40 },
    ],
    outputs: [
      { itemId: "rubber", amount: 2, perMinute: 20 },
    ],
  },
  {
    id: "sulfuric-acid",
    name: "Sulfuric Acid",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "sulfur", amount: 5, perMinute: 50 },
      { itemId: "water", amount: 5, perMinute: 50 },
    ],
    outputs: [
      { itemId: "sulfuric-acid", amount: 5, perMinute: 50 },
    ],
  },
  {
    id: "smokeless-powder",
    name: "Smokeless Powder",
    buildingId: "refinery",
    isAlternate: false,
    duration: 6,
    inputs: [
      { itemId: "black-powder", amount: 2, perMinute: 20 },
      { itemId: "heavy-oil-residue", amount: 1, perMinute: 10 },
    ],
    outputs: [
      { itemId: "smokeless-powder", amount: 2, perMinute: 20 },
    ],
  },

  // ============================================================
  // PACKAGER RECIPES
  // ============================================================
  {
    id: "packaged-water",
    name: "Packaged Water",
    buildingId: "packager",
    isAlternate: false,
    duration: 2,
    inputs: [
      { itemId: "water", amount: 2, perMinute: 60 },
      { itemId: "empty-canister", amount: 2, perMinute: 60 },
    ],
    outputs: [
      { itemId: "packaged-water", amount: 2, perMinute: 60 },
    ],
  },
  {
    id: "unpackage-water",
    name: "Unpackage Water",
    buildingId: "packager",
    isAlternate: false,
    duration: 2,
    inputs: [
      { itemId: "packaged-water", amount: 2, perMinute: 60 },
    ],
    outputs: [
      { itemId: "water", amount: 2, perMinute: 60 },
      { itemId: "empty-canister", amount: 2, perMinute: 60 },
    ],
  },
];
