# SatisFactoryPlaner

A visual factory planner for Satisfactory. Design production chains on a canvas, connect buildings with conveyor belts and pipes, and get real-time throughput analysis with bottleneck detection.

## Features

### Factory Editor
- Drag-and-drop building placement on an infinite canvas
- 48 buildings across 7 categories (source, production, logistics, power, storage, transport, special)
- 101 items and 100+ recipes including alternate recipes
- Conveyor belts (Mk.1-6: 60-1200 items/min) and pipes (Mk.1-2: 300-600 m3/min)
- Building rotation (R key), copy/paste, multi-select
- Quick-add search (Q shortcut)

### Throughput Analysis
- Real-time flow analysis with forward and backward propagation
- **Green** nodes/edges: balanced production chain
- **Yellow** nodes: partially starved inputs (50-99%)
- **Red** nodes/edges: severely starved inputs (<50%) or belt overcapacity
- **Orange** nodes: bottleneck (downstream demands more than this building can produce)
- **Blue** nodes/edges: overproducing (output exceeds downstream consumption)
- Belt/pipe capacity checks: edges turn red when flow exceeds tier limit
- Storage containers and Awesome Sink act as valid chain endpoints

### Configurable Resource Nodes
- Select output item and rate for source buildings
- Filtered item lists per source type (solid for Resource Node, fluid for Resource Well)
- Overclock slider (1-250%)

## Tech Stack

- **Next.js** with TypeScript
- **React Flow** (@xyflow/react) for the canvas editor
- **Zustand** with Immer for state management
- **Convex** backend
- **Better-Auth** for authentication
- **Tailwind CSS** + shadcn/ui (Radix primitives)
- **Turborepo** monorepo with Biome linting

## Project Structure

```
SatisFactoryPlaner/
├── apps/
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # Next.js app router pages
│           ├── components/     # React components
│           │   └── canvas/     # Editor: FlowEditor, BuildingNode, edges
│           ├── data/           # Buildings, items, recipes, tiers
│           ├── hooks/          # useFlowAnalysis, custom hooks
│           ├── lib/            # flowAnalysis engine, geometry, constants
│           └── store/          # Zustand stores (building, connection, UI)
├── packages/
│   ├── backend/                # Convex backend functions
│   ├── config/                 # Shared config (TypeScript, Tailwind)
│   ├── env/                    # Environment variable validation
│   └── ui/                     # Shared UI components (shadcn/ui)
```

## Getting Started

```bash
bun install
bun run dev:setup    # Setup Convex backend
bun run dev          # Start dev server
```

Open [http://localhost:3001](http://localhost:3001)

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps in dev mode |
| `bun run build` | Build all apps |
| `bun run dev:web` | Start only the web app |
| `bun run dev:server` | Start only the backend |
| `bun run check-types` | TypeScript type checking |
| `bun run check` | Biome lint and format |
