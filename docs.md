# Architecture Documentation

## Flow Analysis Engine

**File:** `apps/web/src/lib/flowAnalysis.ts`

Pure function `analyzeFlow(buildings, connections)` that computes throughput status for every node and edge.

### Algorithm

**1. Topological Sort** (Kahn's algorithm)
- Orders buildings from sources to sinks
- Handles cycles gracefully (appended at end)

**2. Forward Pass** (sources → sinks)
- Propagates actual flow rates through the graph
- Source nodes: `outputRate = sourceRate * overclockPercent / 100`
- Production buildings: `outputRate = recipeRate * overclock * satisfactionRatio`
- Satisfaction ratio: `min(actualInput / demandedInput)` across all input ports, capped at 1.0
- Splitters: divide input evenly among connected outputs
- Mergers: sum all inputs
- Storage: pass-through (input → output)
- Sinks (Awesome Sink): absorb all input

**3. Backward Pass** (sinks → sources)
- Propagates downstream demand in reverse topological order
- Production buildings: demand = recipe input rates
- Splitters: input demand = sum of all output downstream demands
- Mergers: output demand distributed **proportionally** to actual flow per input
- Sinks / Storage-as-endpoint: demand = actual flow (no upstream pressure)

**4. Status Determination**

Node statuses (priority order):
| Status | Color | Condition |
|--------|-------|-----------|
| `error` | Red | Input satisfaction < 50% |
| `warning` | Yellow | Input satisfaction 50-99% |
| `bottleneck` | Orange | Inputs OK but downstream demands more than capacity |
| `overproducing` | Blue | Inputs OK but output exceeds downstream consumption |
| `ok` | Green | Balanced — inputs satisfied, outputs consumed |
| `idle` | Default | No recipe, no connections, or not configured |

Edge statuses:
| Status | Color | Condition |
|--------|-------|-----------|
| `overcapacity` | Red | Source flow exceeds belt/pipe tier limit |
| `bottleneck` | Red | Flow < target demand |
| `overproducing` | Blue | Flow > 0 but target demand = 0 |
| `ok` | Green | Flow matches demand |

### Building Classifications

| Set | Buildings | Behavior |
|-----|-----------|----------|
| `SPLITTER_IDS` | splitter, smart-splitter, programmable-splitter | Divide evenly |
| `MERGER_IDS` | merger, priority-merger | Sum inputs |
| `PASSTHROUGH_IDS` | conveyor-belt, conveyor-floor-hole, pipeline, pipeline-floor-hole | 1:1 pass-through |
| `JUNCTION_IDS` | pipeline-junction | Merger + splitter combined |
| `STORAGE_IDS` | storage-container, industrial-storage-container, fluid-buffer, industrial-fluid-buffer, dimensional-depot | Pass-through or sink |
| `SINK_IDS` | awesome-sink | Infinite capacity sink |

---

## State Management

### Zustand Stores

**`buildingStore`** — Building instances (PlacedBuilding)
- `buildings`: Record of all placed buildings with position, rotation, recipe, overclock
- Actions: `addBuilding`, `removeBuilding`, `setRecipe`, `setOverclock`, `setSourceItem`, `setSourceRate`

**`connectionStore`** — Connections between buildings
- `connections`: Record of all edges with source/target instance+port, type (conveyor/pipe), tier
- Actions: `addConnection`, `removeConnection`, `setTier`

**`uiStore`** — UI state (selection, focus, highlights)
- `selectedInstanceIds`, `focusedInstanceId`, `highlightedEdgeIds`, `showEdgeLabels`

**`historyStore`** — Undo/redo snapshots

### Data Flow

```
buildingStore + connectionStore
        ↓
  useFlowAnalysis() hook (useMemo)
        ↓
  FlowAnalysisContext.Provider (in FlowEditor)
        ↓
  useNodeAnalysis(id) → BuildingNode status colors
  useEdgeAnalysis(id) → ConveyorEdge/PipeEdge status colors
```

---

## Key Components

### `FlowEditor.tsx`
- Main canvas component wrapping React Flow
- Provides `FlowAnalysisContext` to all child nodes/edges
- Handles node/edge CRUD, keyboard shortcuts, drag-to-add

### `BuildingNode.tsx`
- Renders all building types (source, production, logistics, storage, special)
- Source nodes: circular with item selector + rate input
- Production nodes: rectangular with recipe selector + overclock slider
- Status border glow based on flow analysis
- Port rate labels positioned near handles

### `ConveyorEdge.tsx` / `PipeEdge.tsx`
- Smooth step path edges with tier selector dropdown
- Color based on edge analysis status
- Label shows tier throughput (clickable to change tier)

---

## Data Files

| File | Contents |
|------|----------|
| `data/buildings.ts` | 48 building definitions with ports, dimensions, colors |
| `data/items.ts` | 101 items (solid + fluid) |
| `data/recipes.ts` | All recipes with input/output rates per minute |
| `data/conveyor-tiers.ts` | Mk.1-6 belt tiers (60-1200/min) |
| `data/pipe-tiers.ts` | Mk.1-2 pipe tiers (300-600 m3/min) |
| `data/index.ts` | Helper lookups: `getBuildingDef`, `getItem`, `getRecipe`, `getConveyorTier`, `getPipeTier` |
