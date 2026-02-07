export type BuildingCategory =
  | "source"
  | "production"
  | "logistics"
  | "power"
  | "storage"
  | "transport"
  | "special";

export type PortType = "conveyor" | "pipe";
export type PortDirection = "input" | "output";

export interface PortDefinition {
  id: string;
  type: PortType;
  direction: PortDirection;
  side: "top" | "right" | "bottom" | "left";
  offset: number; // 0-1 normalized position along edge
}

export interface BuildingDefinition {
  id: string;
  name: string;
  category: BuildingCategory;
  description: string;
  width: number;  // meters (X)
  length: number; // meters (Y/depth in 2D)
  height: number; // meters (Z, for 3D)
  powerConsumption: number; // MW, negative = generates
  ports: PortDefinition[];
  defaultRecipeId?: string;
  canOverclock: boolean;
  somersloopSlots: number;
  color: string; // hex color for rendering
}

export interface ItemDefinition {
  id: string;
  name: string;
  category: "solid" | "fluid";
  stackSize: number;
  sinkPoints?: number;
}

export interface RecipeIO {
  itemId: string;
  amount: number;
  perMinute: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  buildingId: string;
  isAlternate: boolean;
  duration: number; // seconds
  inputs: RecipeIO[];
  outputs: RecipeIO[];
}

export interface ConveyorTier {
  id: string;
  name: string;
  throughput: number; // items/min
}

export interface PipeTier {
  id: string;
  name: string;
  throughput: number; // m3/min
}
