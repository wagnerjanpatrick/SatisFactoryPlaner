import type { ItemDefinition } from "./types";

export const ITEMS: ItemDefinition[] = [
  // === ORES ===
  { id: "iron-ore", name: "Iron Ore", category: "solid", stackSize: 100, sinkPoints: 1 },
  { id: "copper-ore", name: "Copper Ore", category: "solid", stackSize: 100, sinkPoints: 3 },
  { id: "limestone", name: "Limestone", category: "solid", stackSize: 100, sinkPoints: 2 },
  { id: "coal", name: "Coal", category: "solid", stackSize: 100, sinkPoints: 3 },
  { id: "caterium-ore", name: "Caterium Ore", category: "solid", stackSize: 100, sinkPoints: 7 },
  { id: "raw-quartz", name: "Raw Quartz", category: "solid", stackSize: 100, sinkPoints: 15 },
  { id: "sulfur", name: "Sulfur", category: "solid", stackSize: 100, sinkPoints: 11 },
  { id: "bauxite", name: "Bauxite", category: "solid", stackSize: 100, sinkPoints: 8 },
  { id: "uranium", name: "Uranium", category: "solid", stackSize: 100, sinkPoints: 35 },
  { id: "sam", name: "SAM", category: "solid", stackSize: 100, sinkPoints: 0 },

  // === INGOTS ===
  { id: "iron-ingot", name: "Iron Ingot", category: "solid", stackSize: 100, sinkPoints: 2 },
  { id: "copper-ingot", name: "Copper Ingot", category: "solid", stackSize: 100, sinkPoints: 6 },
  { id: "steel-ingot", name: "Steel Ingot", category: "solid", stackSize: 100, sinkPoints: 8 },
  { id: "caterium-ingot", name: "Caterium Ingot", category: "solid", stackSize: 100, sinkPoints: 42 },
  { id: "aluminum-ingot", name: "Aluminum Ingot", category: "solid", stackSize: 100, sinkPoints: 131 },

  // === BASIC PARTS ===
  { id: "iron-plate", name: "Iron Plate", category: "solid", stackSize: 200, sinkPoints: 6 },
  { id: "iron-rod", name: "Iron Rod", category: "solid", stackSize: 200, sinkPoints: 4 },
  { id: "copper-sheet", name: "Copper Sheet", category: "solid", stackSize: 200, sinkPoints: 24 },
  { id: "steel-beam", name: "Steel Beam", category: "solid", stackSize: 200, sinkPoints: 64 },
  { id: "steel-pipe", name: "Steel Pipe", category: "solid", stackSize: 200, sinkPoints: 24 },
  { id: "aluminum-sheet", name: "Aluminum Sheet", category: "solid", stackSize: 200, sinkPoints: 266 },
  { id: "wire", name: "Wire", category: "solid", stackSize: 500, sinkPoints: 6 },
  { id: "cable", name: "Cable", category: "solid", stackSize: 200, sinkPoints: 24 },
  { id: "quickwire", name: "Quickwire", category: "solid", stackSize: 500, sinkPoints: 17 },
  { id: "concrete", name: "Concrete", category: "solid", stackSize: 500, sinkPoints: 12 },
  { id: "quartz-crystal", name: "Quartz Crystal", category: "solid", stackSize: 200, sinkPoints: 50 },
  { id: "silica", name: "Silica", category: "solid", stackSize: 200, sinkPoints: 20 },
  { id: "screw", name: "Screw", category: "solid", stackSize: 500, sinkPoints: 2 },

  // === INDUSTRIAL PARTS ===
  { id: "reinforced-iron-plate", name: "Reinforced Iron Plate", category: "solid", stackSize: 100, sinkPoints: 120 },
  { id: "modular-frame", name: "Modular Frame", category: "solid", stackSize: 50, sinkPoints: 408 },
  { id: "heavy-modular-frame", name: "Heavy Modular Frame", category: "solid", stackSize: 50, sinkPoints: 11520 },
  { id: "encased-industrial-beam", name: "Encased Industrial Beam", category: "solid", stackSize: 100, sinkPoints: 632 },
  { id: "rotor", name: "Rotor", category: "solid", stackSize: 100, sinkPoints: 140 },
  { id: "stator", name: "Stator", category: "solid", stackSize: 100, sinkPoints: 240 },
  { id: "motor", name: "Motor", category: "solid", stackSize: 50, sinkPoints: 1520 },
  { id: "turbo-motor", name: "Turbo Motor", category: "solid", stackSize: 50, sinkPoints: 242720 },

  // === ELECTRONICS ===
  { id: "circuit-board", name: "Circuit Board", category: "solid", stackSize: 200, sinkPoints: 696 },
  { id: "ai-limiter", name: "AI Limiter", category: "solid", stackSize: 100, sinkPoints: 920 },
  { id: "high-speed-connector", name: "High-Speed Connector", category: "solid", stackSize: 100, sinkPoints: 3776 },
  { id: "computer", name: "Computer", category: "solid", stackSize: 50, sinkPoints: 17260 },
  { id: "supercomputer", name: "Supercomputer", category: "solid", stackSize: 50, sinkPoints: 99576 },
  { id: "radio-control-unit", name: "Radio Control Unit", category: "solid", stackSize: 50, sinkPoints: 19600 },

  // === OIL PRODUCTS ===
  { id: "plastic", name: "Plastic", category: "solid", stackSize: 200, sinkPoints: 75 },
  { id: "rubber", name: "Rubber", category: "solid", stackSize: 200, sinkPoints: 60 },
  { id: "petroleum-coke", name: "Petroleum Coke", category: "solid", stackSize: 200, sinkPoints: 20 },
  { id: "polymer-resin", name: "Polymer Resin", category: "solid", stackSize: 200, sinkPoints: 12 },
  { id: "packaged-water", name: "Packaged Water", category: "solid", stackSize: 100, sinkPoints: 130 },
  { id: "packaged-oil", name: "Packaged Oil", category: "solid", stackSize: 100, sinkPoints: 180 },
  { id: "packaged-fuel", name: "Packaged Fuel", category: "solid", stackSize: 100, sinkPoints: 270 },
  { id: "empty-canister", name: "Empty Canister", category: "solid", stackSize: 100, sinkPoints: 60 },

  // === ADVANCED PARTS ===
  { id: "aluminum-casing", name: "Aluminum Casing", category: "solid", stackSize: 200, sinkPoints: 393 },
  { id: "alclad-aluminum-sheet", name: "Alclad Aluminum Sheet", category: "solid", stackSize: 200, sinkPoints: 266 },
  { id: "heat-sink", name: "Heat Sink", category: "solid", stackSize: 100, sinkPoints: 2804 },
  { id: "cooling-system", name: "Cooling System", category: "solid", stackSize: 50, sinkPoints: 12006 },
  { id: "fused-modular-frame", name: "Fused Modular Frame", category: "solid", stackSize: 50, sinkPoints: 62840 },
  { id: "battery", name: "Battery", category: "solid", stackSize: 200, sinkPoints: 465 },
  { id: "crystal-oscillator", name: "Crystal Oscillator", category: "solid", stackSize: 100, sinkPoints: 3072 },
  { id: "electromagnetic-control-rod", name: "Electromagnetic Control Rod", category: "solid", stackSize: 100, sinkPoints: 2560 },
  { id: "pressure-conversion-cube", name: "Pressure Conversion Cube", category: "solid", stackSize: 50, sinkPoints: 257312 },
  { id: "assembly-director-system", name: "Assembly Director System", category: "solid", stackSize: 50, sinkPoints: 543632 },
  { id: "magnetic-field-generator", name: "Magnetic Field Generator", category: "solid", stackSize: 50, sinkPoints: 15650 },
  { id: "thermal-propulsion-rocket", name: "Thermal Propulsion Rocket", category: "solid", stackSize: 50, sinkPoints: 732956 },
  { id: "nuclear-pasta", name: "Nuclear Pasta", category: "solid", stackSize: 50, sinkPoints: 543424 },

  // === NUCLEAR ===
  { id: "uranium-fuel-rod", name: "Uranium Fuel Rod", category: "solid", stackSize: 50, sinkPoints: 44092 },
  { id: "plutonium-fuel-rod", name: "Plutonium Fuel Rod", category: "solid", stackSize: 50, sinkPoints: 153184 },
  { id: "uranium-waste", name: "Uranium Waste", category: "solid", stackSize: 500, sinkPoints: 0 },
  { id: "plutonium-waste", name: "Plutonium Waste", category: "solid", stackSize: 500, sinkPoints: 0 },
  { id: "non-fissile-uranium", name: "Non-fissile Uranium", category: "solid", stackSize: 500, sinkPoints: 0 },
  { id: "plutonium-pellet", name: "Plutonium Pellet", category: "solid", stackSize: 100, sinkPoints: 0 },
  { id: "encased-plutonium-cell", name: "Encased Plutonium Cell", category: "solid", stackSize: 200, sinkPoints: 0 },

  // === FLUIDS ===
  { id: "water", name: "Water", category: "fluid", stackSize: 0 },
  { id: "crude-oil", name: "Crude Oil", category: "fluid", stackSize: 0 },
  { id: "heavy-oil-residue", name: "Heavy Oil Residue", category: "fluid", stackSize: 0 },
  { id: "fuel", name: "Fuel", category: "fluid", stackSize: 0 },
  { id: "turbofuel", name: "Turbofuel", category: "fluid", stackSize: 0 },
  { id: "liquid-biofuel", name: "Liquid Biofuel", category: "fluid", stackSize: 0 },
  { id: "alumina-solution", name: "Alumina Solution", category: "fluid", stackSize: 0 },
  { id: "sulfuric-acid", name: "Sulfuric Acid", category: "fluid", stackSize: 0 },
  { id: "nitric-acid", name: "Nitric Acid", category: "fluid", stackSize: 0 },
  { id: "nitrogen-gas", name: "Nitrogen Gas", category: "fluid", stackSize: 0 },
];
