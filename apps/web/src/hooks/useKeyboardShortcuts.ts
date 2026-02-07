import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { useHistoryStore } from "@/store/historyStore";

export function useKeyboardShortcuts() {
	const setToolMode = useUIStore((s) => s.setToolMode);
	const toggleGrid = useUIStore((s) => s.toggleGrid);
	const clearSelection = useUIStore((s) => s.clearSelection);
	const undo = useHistoryStore((s) => s.undo);
	const redo = useHistoryStore((s) => s.redo);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.tagName === "SELECT"
			) {
				return;
			}

			if (e.ctrlKey || e.metaKey) {
				if (e.key === "z") {
					e.preventDefault();
					undo();
					return;
				}
				if (e.key === "y") {
					e.preventDefault();
					redo();
					return;
				}
			}

			switch (e.key.toLowerCase()) {
				case "v":
					setToolMode("select");
					break;
				case "b":
					setToolMode("build");
					break;
				case "c":
					setToolMode("connect");
					break;
				case "x":
					setToolMode("delete");
					break;
				case "h":
					setToolMode("pan");
					break;
				case "g":
					toggleGrid();
					break;
				case "escape":
					clearSelection();
					setToolMode("select");
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [setToolMode, toggleGrid, clearSelection, undo, redo]);
}
