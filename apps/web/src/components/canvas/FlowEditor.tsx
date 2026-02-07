"use client";

import { useState, useCallback, useEffect, useRef, useMemo, type DragEvent } from "react";
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

	// Zustand store actions only (no reactive state subscriptions that would re-render)
	const addBuilding = useBuildingStore((s) => s.addBuilding);
	const moveBuilding = useBuildingStore((s) => s.moveBuilding);
	const removeBuildings = useBuildingStore((s) => s.removeBuildings);
	const rotateBuilding = useBuildingStore((s) => s.rotateBuilding);
	const setRecipe = useBuildingStore((s) => s.setRecipe);
	const setOverclock = useBuildingStore((s) => s.setOverclock);

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

	// Snap helper: snaps left-edge X to grid, handle-center Y to grid.
	const snapToHandleGrid = useCallback(
		(topLeftX: number, topLeftY: number, buildingId: string, rotation: 0 | 90 | 180 | 270) => {
			const snapPx = gridSnapSize * PIXELS_PER_METER;
			const def = getBuildingDef(buildingId);
			const { length } = def
				? getRotatedSize(def, rotation)
				: { length: 0 };
			const pxHeight = length * PIXELS_PER_METER;
			const handleCenterY = topLeftY + pxHeight / 2;
			const snappedHandleY = Math.round(handleCenterY / snapPx) * snapPx;
			const snappedX = Math.round(topLeftX / snapPx) * snapPx;
			return { x: snappedX, y: snappedHandleY - pxHeight / 2 };
		},
		[gridSnapSize],
	);

	// Snap grid for React Flow's built-in snapping (pixels)
	const snapGridValue: [number, number] = useMemo(
		() => [gridSnapSize * PIXELS_PER_METER, gridSnapSize * PIXELS_PER_METER],
		[gridSnapSize],
	);

	// Sync Zustand buildings → React Flow nodes via store subscription (no component re-render)
	useEffect(() => {
		let prevBuildings: Record<string, PlacedBuilding> = {};

		// Initial sync
		const initial = useBuildingStore.getState().buildings;
		if (Object.keys(initial).length > 0) {
			setNodes(Object.values(initial).map(buildingToNode));
			prevBuildings = initial;
		}

		const unsubscribe = useBuildingStore.subscribe((state) => {
			if (isSyncingRef.current) return;

			const curr = state.buildings;
			const prev = prevBuildings;
			prevBuildings = curr;

			if (prev === curr) return;

			const prevIds = new Set(Object.keys(prev));
			const currIds = new Set(Object.keys(curr));

			// Added — append to existing array, keeping existing node references intact
			const added: BuildingNodeType[] = [];
			for (const id of currIds) {
				if (!prevIds.has(id)) {
					added.push(buildingToNode(curr[id]));
				}
			}
			if (added.length > 0) {
				setNodes((nds) => nds.concat(added));
			}

			// Removed
			const removedIds: string[] = [];
			for (const id of prevIds) {
				if (!currIds.has(id)) {
					removedIds.push(id);
				}
			}
			if (removedIds.length > 0) {
				const removedSet = new Set(removedIds);
				setNodes((nds) => nds.filter((n) => !removedSet.has(n.id)));
			}

			// Changed — only update nodes whose store object actually changed
			const changedIds: string[] = [];
			for (const id of currIds) {
				if (!prevIds.has(id)) continue;
				if (prev[id] !== curr[id]) {
					changedIds.push(id);
				}
			}
			if (changedIds.length > 0) {
				const changedSet = new Set(changedIds);
				setNodes((nds) =>
					nds.map((n) => {
						if (!changedSet.has(n.id)) return n;
						const converted = buildingToNode(curr[n.id]);
						return { ...n, position: converted.position, data: converted.data };
					}),
				);
			}
		});

		return unsubscribe;
	}, [setNodes]);

	// Sync Zustand connections → React Flow edges via store subscription
	useEffect(() => {
		// Initial sync
		const initial = useConnectionStore.getState().connections;
		if (Object.keys(initial).length > 0) {
			setEdges(Object.values(initial).map(connectionToEdge));
		}

		const unsubscribe = useConnectionStore.subscribe((state) => {
			if (isSyncingRef.current) return;
			setEdges(Object.values(state.connections).map(connectionToEdge));
		});

		return unsubscribe;
	}, [setEdges]);

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
				updateNodeInternals(idsToRotate);
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

				const PASTE_OFFSET = 2;
				const newIds: string[] = [];
				for (const b of copied) {
					const newId = addBuilding(
						b.buildingId,
						b.x + PASTE_OFFSET,
						b.y + PASTE_OFFSET,
						b.rotation,
					);
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

	// --- Connection validation (uses getState, stable callback) ---
	const isValidConnection: IsValidConnection = useCallback(
		(connection) => {
			const { source, target, sourceHandle, targetHandle } = connection;
			if (!source || !target || !sourceHandle || !targetHandle) return false;
			if (source === target) return false;

			const buildings = useBuildingStore.getState().buildings;
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

			const connections = useConnectionStore.getState().connections;
			const inputAlreadyConnected = Object.values(connections).some(
				(c) =>
					c.targetInstanceId === target && c.targetPortId === targetHandle,
			);
			if (inputAlreadyConnected) return false;

			const outputAlreadyConnected = Object.values(connections).some(
				(c) =>
					c.sourceInstanceId === source && c.sourcePortId === sourceHandle,
			);
			if (outputAlreadyConnected) return false;

			return true;
		},
		[],
	);

	// --- Handle new connection (uses getState, stable callback) ---
	const onConnect: OnConnect = useCallback(
		(params) => {
			if (
				!params.source ||
				!params.target ||
				!params.sourceHandle ||
				!params.targetHandle
			)
				return;

			const buildings = useBuildingStore.getState().buildings;
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
		[pushSnapshot, addConnection],
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
			const pxWidth = (def?.width ?? 0) * PIXELS_PER_METER;
			const pxHeight = (def?.length ?? 0) * PIXELS_PER_METER;

			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			const snapped = snapToHandleGrid(
				position.x - pxWidth / 2,
				position.y - pxHeight / 2,
				buildingId,
				0,
			);

			pushSnapshot();
			addBuilding(
				buildingId,
				snapped.x / PIXELS_PER_METER,
				snapped.y / PIXELS_PER_METER,
			);
		},
		[screenToFlowPosition, snapToHandleGrid, pushSnapshot, addBuilding],
	);

	// --- Clear focus on drag so panel doesn't show during/after drag ---
	const onNodeDragStart: OnNodeDrag = useCallback(
		() => {
			isDraggingRef.current = true;
			setFocusedInstance(null);
		},
		[setFocusedInstance],
	);

	// --- Sync drag position back to store ---
	const onNodeDragStop: OnNodeDrag = useCallback(
		(_event, node) => {
			isSyncingRef.current = true;
			pushSnapshot();
			moveBuilding(
				node.id,
				node.position.x / PIXELS_PER_METER,
				node.position.y / PIXELS_PER_METER,
			);
			requestAnimationFrame(() => {
				isSyncingRef.current = false;
			});
			setTimeout(() => {
				isDraggingRef.current = false;
			}, 100);
		},
		[pushSnapshot, moveBuilding],
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

	// --- Selection sync + full chain highlight (uses getState, stable callback) ---
	const onSelectionChange: OnSelectionChangeFunc = useCallback(
		({ nodes: selectedNodes }) => {
			const selectedIds = selectedNodes.map((n) => n.id);
			const prevIds = useUIStore.getState().selectedInstanceIds;

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

			const conns = Object.values(useConnectionStore.getState().connections);
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

			const edgeIds = conns
				.filter((c) => visited.has(c.sourceInstanceId) && visited.has(c.targetInstanceId))
				.map((c) => c.id);

			setHighlightedEdgeIds(edgeIds);
		},
		[setSelectedInstances, setFocusedInstance, setHighlightedEdgeIds],
	);

	// --- Track focused (last-clicked) node for panel display ---
	const onNodeClick = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			if (isDraggingRef.current) return;
			setFocusedInstance(node.id);
		},
		[setFocusedInstance],
	);

	// --- Connection dropped on empty space → show search popup (uses getState) ---
	const onConnectEnd: OnConnectEnd = useCallback(
		(event, connectionState) => {
			if (connectionState.isValid) return;

			const fromHandle = connectionState.fromHandle;
			const fromNode = connectionState.fromNode;
			if (!fromHandle?.id || !fromNode) return;

			const buildings = useBuildingStore.getState().buildings;
			const building = buildings[fromNode.id];
			if (!building) return;
			const def = getBuildingDef(building.buildingId);
			if (!def) return;
			const port = def.ports.find((p) => p.id === fromHandle.id);
			if (!port) return;

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
		[screenToFlowPosition],
	);

	// --- Handle building selection from search popup ---
	const handleNodeSearchSelect = useCallback(
		(buildingId: string) => {
			if (!connectDropState) return;

			const def = getBuildingDef(buildingId);
			if (!def) return;

			const { flowPosition, sourceNodeId, sourcePortId, portType, portDirection } = connectDropState;

			const pxWidth = def.width * PIXELS_PER_METER;
			const pxHeight = def.length * PIXELS_PER_METER;
			const snapped = snapToHandleGrid(
				flowPosition.x - pxWidth / 2,
				flowPosition.y - pxHeight / 2,
				buildingId,
				0,
			);

			pushSnapshot();
			const newInstanceId = addBuilding(
				buildingId,
				snapped.x / PIXELS_PER_METER,
				snapped.y / PIXELS_PER_METER,
			);

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
		[connectDropState, snapToHandleGrid, pushSnapshot, addBuilding, addConnection],
	);

	// --- Handle quick-add building at viewport center ---
	const handleQuickAdd = useCallback(
		(buildingId: string) => {
			const def = getBuildingDef(buildingId);
			if (!def) return;

			const canvasEl = document.querySelector(".react-flow") as HTMLElement | null;
			const rect = canvasEl?.getBoundingClientRect();
			const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
			const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
			const flowPos = screenToFlowPosition({ x: centerX, y: centerY });

			const pxWidth = def.width * PIXELS_PER_METER;
			const pxHeight = def.length * PIXELS_PER_METER;
			const snapped = snapToHandleGrid(
				flowPos.x - pxWidth / 2,
				flowPos.y - pxHeight / 2,
				buildingId,
				0,
			);

			pushSnapshot();
			addBuilding(
				buildingId,
				snapped.x / PIXELS_PER_METER,
				snapped.y / PIXELS_PER_METER,
			);

			setQuickAddOpen(false);
		},
		[snapToHandleGrid, pushSnapshot, addBuilding, screenToFlowPosition],
	);

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
				defaultEdgeOptions={defaultEdgeOptions}
				snapToGrid
				snapGrid={snapGridValue}
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
