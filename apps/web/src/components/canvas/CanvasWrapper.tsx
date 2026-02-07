"use client";

import dynamic from "next/dynamic";
import { ReactFlowProvider } from "@xyflow/react";

const FlowEditor = dynamic(() => import("./FlowEditor"), {
	ssr: false,
});

export function CanvasWrapper() {
	return (
		<ReactFlowProvider>
			<FlowEditor />
		</ReactFlowProvider>
	);
}
