"use client";

import { useState, useCallback, useEffect, useRef, type DragEvent } from "react";
import {
	ReactFlow,
	Background,
	MiniMap,
	useNodesState,
	useEdgesState,
	BackgroundVariant,
	useReactFlow,
	useUpdateNodeInternals,
	type OnConnect,
	type OnConnectEnd,
	type IsValidConnection,
	type NodeTypes,
	type EdgeTypes,
	type Node,
	type Edge,
	type OnSelectionChangeFunc,
	type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { BuildingNode as BuildingNodeType, ConnectionEdge } from "@/store/flowTypes";
import type { PlacedBuilding } from "@/store/types";
import BuildingNode from "./BuildingNode";
import ConveyorEdge from "./ConveyorEdge";
import PipeEdge from "./PipeEdge";
import { useUIStore } from "@/store/uiStore";
import { useBuildingStore } from "@/store/buildingStore";
import { useConnectionStore } from "@/store/connectionStore";
import { useHistoryStore } from "@/store/historyStore";
import { getBuildingDef } from "@/data";
import type { PortType, PortDirection } from "@/data/types";
import { buildingToNode, connectionToEdge } from "@/lib/flowConversions";
import { getRotatedSize } from "@/lib/geometry";
import { PIXELS_PER_METER, GRID_SIZE, COLORS } from "@/lib/constants";
import { NodeSearchPopup } from "./NodeSearchPopup";
import { QuickAddPopup } from "./QuickAddPopup";
import { SidebarToggle } from "./SidebarToggle";
import { FloatingToolbar } from "./FloatingToolbar";
import { SettingsOverlay } from "./SettingsOverlay";
import { StatusOverlay } from "./StatusOverlay";
import { useFlowAnalysis, FlowAnalysisContext } from "@/hooks/useFlowAnalysis";

const nodeTypes: NodeTypes = {
	building: BuildingNode as unknown as NodeTypes["building"],
};

const edgeTypes: EdgeTypes = {
	conveyor: ConveyorEdge as unknown as EdgeTypes["conveyor"],
	pipe: PipeEdge as unknown as EdgeTypes["pipe"],
};

const defaultEdgeOptions = {};

export default function FlowEditor() {
	const { screenToFlowPosition } = useReactFlow();
	const updateNodeInternals = useUpdateNodeInternals();

	// Zustand stores
	const buildings = useBuildingStore((s) => s.buildings);
	const addBuilding = useBuildingStore((s) => s.addBuilding);
	const moveBuilding = useBuildingStore((s) => s.moveBuilding);
	const removeBuildings = useBuildingStore((s) => s.removeBuildings);
	const rotateBuilding = useBuildingStore((s) => s.rotateBuilding);
	const setRecipe = useBuildingStore((s) => s.setRecipe);
	const setOverclock = useBuildingStore((s) => s.setOverclock);

	const connections = useConnectionStore((s) => s.connections);
	const addConnection = useConnectionStore((s) => s.addConnection);
	const removeConnection = useConnectionStore((s) => s.removeConnection);
	const removeConnectionsForBuilding = useConnectionStore(
		(s) => s.removeConnectionsForBuilding,
	);

	const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

	const analysis = useFlowAnalysis();

	const gridSnapSize = useUIStore((s) => s.gridSnapSize);
	const showGrid = useUIStore((s) => s.showGrid);
	const setSelectedInstances = useUIStore((s) => s.setSelectedInstances);
	const setFocusedInstance = useUIStore((s) => s.setFocusedInstance);
	const setHighlightedEdgeIds = useUIStore((s) => s.setHighlightedEdgeIds);

	// React Flow node/edge state
	const [nodes, setNodes, onNodesChange] = useNodesState<BuildingNodeType>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<ConnectionEdge>([]);

	// Track whether we're the ones causing the store update (to avoid echo loops)
	const isSyncingRef = useRef(false);
	const mountedRef = useRef(false);
	const isDraggingRef = useRef(false);

	// State for "drag connection to empty space → search popup"
	const [connectDropState, setConnectDropState] = useState<{
		screenPosition: { x: number; y: number };
		flowPosition: { x: number; y: number };
		sourceNodeId: string;
		sourcePortId: string;
		portType: PortType;
		portDirection: PortDirection;
	} | null>(null);

	// State for "quick add" popup (Q key or search button)
	const [quickAddOpen, setQuickAddOpen] = useState(false);

	// Sync Zustand buildings → React Flow nodes
	useEffect(() => {
		if (isSyncingRef.current) return;
		setNodes(Object.values(buildings).map(buildingToNode));
	}, [buildings, setNodes]);

	// Sync Zustand connections → React Flow edges
	useEffect(() => {
		if (isSyncingRef.current) return;
		setEdges(Object.values(connections).map(connectionToEdge));
	}, [connections, setEdges]);

	useEffect(() => {
		mountedRef.current = true;
	}, []);

	// --- Clipboard for copy/paste ---
	const clipboardRef = useRef<PlacedBuilding[]>([]);

	// --- Keyboard shortcuts ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

			// R — rotate hovered node, or all selected if nothing hovered
			if (e.key === "r" || e.key === "R") {
				const hoveredId = useUIStore.getState().hoveredInstanceId;
				const selectedIds = useUIStore.getState().selectedInstanceIds;
				const idsToRotate = hoveredId ? [hoveredId] : selectedIds;
				if (idsToRotate.length === 0) return;
				e.preventDefault();
				pushSnapshot();
				for (const sid of idsToRotate) {
					rotateBuilding(sid);
				}
				// Tell React Flow to re-measure handle positions (uses RAF internally)
				updateNodeInternals(idsToRotate);
				// After handles are measured, force a full node refresh so edges
				// pick up the updated handle bounds. Then re-measure once more
				// from the final DOM to ensure perfect alignment.
				setTimeout(() => {
					isSyncingRef.current = true;
					const b = useBuildingStore.getState().buildings;
					setNodes(Object.values(b).map(buildingToNode));
					requestAnimationFrame(() => {
						updateNodeInternals(idsToRotate);
						requestAnimationFrame(() => {
							isSyncingRef.current = false;
						});
					});
				}, 120);
				return;
			}

			// Ctrl+C — copy selected buildings
			if ((e.ctrlKey || e.metaKey) && e.key === "c") {
				const selectedIds = useUIStore.getState().selectedInstanceIds;
				const allBuildings = useBuildingStore.getState().buildings;
				const copied = selectedIds
					.map((id) => allBuildings[id])
					.filter(Boolean) as PlacedBuilding[];
				if (copied.length > 0) {
					clipboardRef.current = copied;
				}
				return;
			}

			// Ctrl+V — paste copied buildings with offset
			if ((e.ctrlKey || e.metaKey) && e.key === "v") {
				const copied = clipboardRef.current;
				if (copied.length === 0) return;
				e.preventDefault();
				pushSnapshot();

				// Offset pasted buildings by 2 meters
				const PASTE_OFFSET = 2;
				const newIds: string[] = [];
				for (const b of copied) {
					const newId = addBuilding(
						b.buildingId,
						b.x + PASTE_OFFSET,
						b.y + PASTE_OFFSET,
						b.rotation,
					);
					// Copy recipe and overclock
					if (b.recipeId) setRecipe(newId, b.recipeId);
					if (b.overclockPercent !== 100) setOverclock(newId, b.overclockPercent);
					newIds.push(newId);
				}
				setSelectedInstances(newIds);
				return;
			}

			// Q — quick add building
			if (e.key === "q" || e.key === "Q") {
				e.preventDefault();
				setQuickAddOpen(true);
				return;
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [pushSnapshot, rotateBuilding, addBuilding, setRecipe, setOverclock, setSelectedInstances, setNodes, updateNodeInternals, setEdges]);

	// --- Connection validation ---
	const isValidConnection: IsValidConnection = useCallback(
		(connection) => {
			const { source, target, sourceHandle, targetHandle } = connection;
			if (!source || !target || !sourceHandle || !targetHandle) return false;
			if (source === target) return false;

			const sourceBuilding = buildings[source];
			const targetBuilding = buildings[target];
			if (!sourceBuilding || !targetBuilding) return false;

			const sourceDef = getBuildingDef(sourceBuilding.buildingId);
			const targetDef = getBuildingDef(targetBuilding.buildingId);
			if (!sourceDef || !targetDef) return false;

			const sourcePort = sourceDef.ports.find((p) => p.id === sourceHandle);
			const targetPort = targetDef.ports.find((p) => p.id === targetHandle);
			if (!sourcePort || !targetPort) return false;

			if (sourcePort.direction !== "output" || targetPort.direction !== "input")
				return false;
			if (sourcePort.type !== targetPort.type) return false;

			// Max 1 connection per input port
			const inputAlreadyConnected = Object.values(connections).some(
				(c) =>
					c.targetInstanceId === target && c.targetPortId === targetHandle,
			);
			if (inputAlreadyConnected) return false;

			// Max 1 connection per output port
			const outputAlreadyConnected = Object.values(connections).some(
				(c) =>
					c.sourceInstanceId === source && c.sourcePortId === sourceHandle,
			);
			if (outputAlreadyConnected) return false;

			return true;
		},
		[buildings, connections],
	);

	// --- Handle new connection ---
	const onConnect: OnConnect = useCallback(
		(params) => {
			if (
				!params.source ||
				!params.target ||
				!params.sourceHandle ||
				!params.targetHandle
			)
				return;

			const sourceBuilding = buildings[params.source];
			const sourceDef = sourceBuilding
				? getBuildingDef(sourceBuilding.buildingId)
				: null;
			const sourcePort = sourceDef?.ports.find(
				(p) => p.id === params.sourceHandle,
			);

			const portType = sourcePort?.type ?? "conveyor";

			pushSnapshot();
			addConnection(
				params.source,
				params.sourceHandle,
				params.target,
				params.targetHandle,
				portType,
			);
		},
		[buildings, pushSnapshot, addConnection],
	);

	// --- Drag & drop from sidebar ---
	const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const onDrop = useCallback(
		(event: DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			const buildingId = event.dataTransfer.getData(
				"application/satisfactory-building",
			);
			if (!buildingId) return;

			const def = getBuildingDef(buildingId);
			const width = def?.width ?? 0;
			const length = def?.length ?? 0;

			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			// Snap the center position to grid
			const snapPx = gridSnapSize * PIXELS_PER_METER;
			position.x = Math.round(position.x / snapPx) * snapPx;
			position.y = Math.round(position.y / snapPx) * snapPx;

			// Store as top-left (center - half dimensions)
			pushSnapshot();
			addBuilding(
				buildingId,
				position.x / PIXELS_PER_METER - width / 2,
				position.y / PIXELS_PER_METER - length / 2,
			);
		},
		[screenToFlowPosition, gridSnapSize, pushSnapshot, addBuilding],
	);

	// --- Clear focus on drag so panel doesn't show during/after drag ---
	const onNodeDragStart: OnNodeDrag = useCallback(
		() => {
			isDraggingRef.current = true;
			setFocusedInstance(null);
		},
		[setFocusedInstance],
	);

	// --- Sync drag position back to store (center → top-left) ---
	const onNodeDragStop: OnNodeDrag = useCallback(
		(_event, node) => {
			const building = buildings[node.id];
			if (!building) return;
			const def = getBuildingDef(building.buildingId);
			const { width, length } = def
				? getRotatedSize(def, building.rotation)
				: { width: 0, length: 0 };

			isSyncingRef.current = true;
			pushSnapshot();
			moveBuilding(
				node.id,
				node.position.x / PIXELS_PER_METER - width / 2,
				node.position.y / PIXELS_PER_METER - length / 2,
			);
			// Allow next frame to re-enable sync
			requestAnimationFrame(() => {
				isSyncingRef.current = false;
			});
			// Keep dragging flag a bit longer to suppress focus from onSelectionChange
			setTimeout(() => {
				isDraggingRef.current = false;
			}, 100);
		},
		[buildings, pushSnapshot, moveBuilding],
	);

	// --- Handle node deletion ---
	const onNodesDelete = useCallback(
		(deleted: Node[]) => {
			pushSnapshot();
			for (const node of deleted) {
				removeConnectionsForBuilding(node.id);
			}
			removeBuildings(deleted.map((n) => n.id));
		},
		[pushSnapshot, removeBuildings, removeConnectionsForBuilding],
	);

	// --- Handle edge deletion ---
	const onEdgesDelete = useCallback(
		(deleted: Edge[]) => {
			pushSnapshot();
			for (const edge of deleted) {
				removeConnection(edge.id);
			}
		},
		[pushSnapshot, removeConnection],
	);

	// --- Selection sync + full chain highlight ---
	const onSelectionChange: OnSelectionChangeFunc = useCallback(
		({ nodes: selectedNodes }) => {
			const selectedIds = selectedNodes.map((n) => n.id);
			const prevIds = useUIStore.getState().selectedInstanceIds;

			// Only set focus on click, not during/after drag
			if (!isDraggingRef.current) {
				if (selectedIds.length === 1) {
					setFocusedInstance(selectedIds[0]!);
				} else if (selectedIds.length > prevIds.length) {
					const newId = selectedIds.find((id) => !prevIds.includes(id));
					if (newId) setFocusedInstance(newId);
				}
			}

			setSelectedInstances(selectedIds);

			if (selectedIds.length === 0) {
				setFocusedInstance(null);
				setHighlightedEdgeIds([]);
				return;
			}

			// BFS: walk the full connected component from selected nodes
			const conns = Object.values(connections);
			const visited = new Set<string>(selectedIds);
			const queue = [...selectedIds];

			while (queue.length > 0) {
				const nodeId = queue.shift()!;
				for (const c of conns) {
					if (c.sourceInstanceId === nodeId && !visited.has(c.targetInstanceId)) {
						visited.add(c.targetInstanceId);
						queue.push(c.targetInstanceId);
					}
					if (c.targetInstanceId === nodeId && !visited.has(c.sourceInstanceId)) {
						visited.add(c.sourceInstanceId);
						queue.push(c.sourceInstanceId);
					}
				}
			}

			// All edges where both endpoints are in the connected component
			const edgeIds = conns
				.filter((c) => visited.has(c.sourceInstanceId) && visited.has(c.targetInstanceId))
				.map((c) => c.id);

			setHighlightedEdgeIds(edgeIds);
		},
		[setSelectedInstances, setFocusedInstance, setHighlightedEdgeIds, connections],
	);

	// --- Track focused (last-clicked) node for panel display ---
	const onNodeClick = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			// Don't set focus if we just finished dragging
			if (isDraggingRef.current) return;
			setFocusedInstance(node.id);
		},
		[setFocusedInstance],
	);

	// --- Connection dropped on empty space → show search popup ---
	const onConnectEnd: OnConnectEnd = useCallback(
		(event, connectionState) => {
			// Only trigger if the connection was NOT completed (dropped on empty space)
			if (connectionState.isValid) return;

			const fromHandle = connectionState.fromHandle;
			const fromNode = connectionState.fromNode;
			if (!fromHandle?.id || !fromNode) return;

			// Get the source port info
			const building = buildings[fromNode.id];
			if (!building) return;
			const def = getBuildingDef(building.buildingId);
			if (!def) return;
			const port = def.ports.find((p) => p.id === fromHandle.id);
			if (!port) return;

			// Get screen position from the event
			const clientX = "clientX" in event ? event.clientX : event.touches?.[0]?.clientX ?? 0;
			const clientY = "clientY" in event ? event.clientY : event.touches?.[0]?.clientY ?? 0;

			const flowPos = screenToFlowPosition({ x: clientX, y: clientY });

			setConnectDropState({
				screenPosition: { x: clientX, y: clientY },
				flowPosition: flowPos,
				sourceNodeId: fromNode.id,
				sourcePortId: fromHandle.id,
				portType: port.type,
				portDirection: port.direction,
			});
		},
		[buildings, screenToFlowPosition],
	);

	// --- Handle building selection from search popup ---
	const handleNodeSearchSelect = useCallback(
		(buildingId: string) => {
			if (!connectDropState) return;

			const def = getBuildingDef(buildingId);
			if (!def) return;

			const { flowPosition, sourceNodeId, sourcePortId, portType, portDirection } = connectDropState;

			// Snap to grid
			const snapPx = gridSnapSize * PIXELS_PER_METER;
			const snappedX = Math.round(flowPosition.x / snapPx) * snapPx;
			const snappedY = Math.round(flowPosition.y / snapPx) * snapPx;

			// Convert to top-left for store (center - half dims)
			const width = def.width;
			const length = def.length;

			pushSnapshot();
			const newInstanceId = addBuilding(
				buildingId,
				snappedX / PIXELS_PER_METER - width / 2,
				snappedY / PIXELS_PER_METER - length / 2,
			);

			// Find the first compatible port on the new building
			const needDirection: PortDirection = portDirection === "output" ? "input" : "output";
			const targetPort = def.ports.find(
				(p) => p.type === portType && p.direction === needDirection,
			);

			if (targetPort) {
				if (portDirection === "output") {
					addConnection(sourceNodeId, sourcePortId, newInstanceId, targetPort.id, portType);
				} else {
					addConnection(newInstanceId, targetPort.id, sourceNodeId, sourcePortId, portType);
				}
			}

			setConnectDropState(null);
		},
		[connectDropState, gridSnapSize, pushSnapshot, addBuilding, addConnection],
	);

	// --- Handle quick-add building at viewport center ---
	const handleQuickAdd = useCallback(
		(buildingId: string) => {
			const def = getBuildingDef(buildingId);
			if (!def) return;

			// Get the center of the viewport in flow coordinates
			const canvasEl = document.querySelector(".react-flow") as HTMLElement | null;
			const rect = canvasEl?.getBoundingClientRect();
			const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
			const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
			const flowPos = screenToFlowPosition({ x: centerX, y: centerY });

			// Snap to grid
			const snapPx = gridSnapSize * PIXELS_PER_METER;
			const snappedX = Math.round(flowPos.x / snapPx) * snapPx;
			const snappedY = Math.round(flowPos.y / snapPx) * snapPx;

			pushSnapshot();
			addBuilding(
				buildingId,
				snappedX / PIXELS_PER_METER - def.width / 2,
				snappedY / PIXELS_PER_METER - def.length / 2,
			);

			setQuickAddOpen(false);
		},
		[gridSnapSize, pushSnapshot, addBuilding, screenToFlowPosition],
	);

	const snapGrid: [number, number] = [
		gridSnapSize * PIXELS_PER_METER,
		gridSnapSize * PIXELS_PER_METER,
	];

	return (
		<FlowAnalysisContext.Provider value={analysis}>
		<div className="relative flex-1 h-full" style={{ backgroundColor: COLORS.grid.background }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onConnectEnd={onConnectEnd}
				isValidConnection={isValidConnection}
				onDrop={onDrop}
				onDragOver={onDragOver}
				onNodeDragStart={onNodeDragStart}
				onNodeDragStop={onNodeDragStop}
				onNodesDelete={onNodesDelete}
				onEdgesDelete={onEdgesDelete}
				onNodeClick={onNodeClick}
				onSelectionChange={onSelectionChange}
				nodeOrigin={[0.5, 0.5]}
				snapToGrid
				snapGrid={snapGrid}
				defaultEdgeOptions={defaultEdgeOptions}
				deleteKeyCode={["Delete", "Backspace"]}
				multiSelectionKeyCode="Shift"
				colorMode="dark"
				fitView={false}
				minZoom={0.1}
				maxZoom={5}
				defaultViewport={{ x: 0, y: 0, zoom: 1 }}
				proOptions={{ hideAttribution: true }}
			>
				{showGrid && (
					<>
						<Background
							variant={BackgroundVariant.Lines}
							gap={GRID_SIZE * PIXELS_PER_METER}
							color={COLORS.grid.major}
							lineWidth={0.5}
						/>
						<Background
							id="sub-grid"
							variant={BackgroundVariant.Lines}
							gap={PIXELS_PER_METER}
							color={COLORS.grid.minor}
							lineWidth={0.3}
						/>
					</>
				)}
					<MiniMap
					nodeColor={(node) => {
						const def = getBuildingDef(
							(node.data as { buildingId?: string })?.buildingId ?? "",
						);
						return def?.color ?? "#555";
					}}
					style={{ backgroundColor: "#1a1a1a" }}
					zoomable
					pannable
				/>
			</ReactFlow>
			{connectDropState && (
				<NodeSearchPopup
					screenPosition={connectDropState.screenPosition}
					portType={connectDropState.portType}
					portDirection={connectDropState.portDirection}
					onSelect={handleNodeSearchSelect}
					onClose={() => setConnectDropState(null)}
				/>
			)}
			{quickAddOpen && (
				<QuickAddPopup
					onSelect={handleQuickAdd}
					onClose={() => setQuickAddOpen(false)}
				/>
			)}
			<SidebarToggle />
			<FloatingToolbar onQuickAdd={() => setQuickAddOpen(true)} />
			<SettingsOverlay />
			<StatusOverlay />
		</div>
		</FlowAnalysisContext.Provider>
	);
}
