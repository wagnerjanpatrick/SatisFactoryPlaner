export const GRID_SIZE = 8; // 8m foundation grid
export const SUB_GRID = 1; // 1m sub-grid
export const PIXELS_PER_METER = 20; // scale factor for canvas

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;
export const DEFAULT_ZOOM = 1;

export const AUTO_CONNECT_RANGE = 16; // meters (2 foundations)
export const BELT_PADDING = 1; // meters around buildings for belt routing

export const COLORS = {
  grid: {
    major: "#333333",
    minor: "#1a1a1a",
    background: "#0f0f0f",
  },
  port: {
    conveyorInput: "#f97316",
    conveyorOutput: "#f97316",
    pipeInput: "#06b6d4",
    pipeOutput: "#06b6d4",
  },
  belt: {
    conveyor: "#f59e0b",
    pipe: "#06b6d4",
  },
  selection: "#3b82f6",
  ghost: {
    valid: "#22c55e",
    invalid: "#ef4444",
  },
  bottleneck: "#ef4444",
} as const;
