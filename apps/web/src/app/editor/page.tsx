"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function EditorPage() {
	useKeyboardShortcuts();

	return <AppShell />;
}
