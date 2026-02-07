"use client";

import type { ComponentProps } from "react";
import { cn } from "@SatisFactoryPlaner/ui/lib/utils";

export function BaseNode({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"bg-card text-card-foreground relative rounded-md border border-border",
				"hover:ring-1 hover:ring-muted-foreground/50",
				"[.react-flow__node.selected_&]:border-primary",
				"[.react-flow__node.selected_&]:shadow-lg",
				"[.react-flow__node.selected_&]:shadow-primary/20",
				className,
			)}
			tabIndex={0}
			{...props}
		/>
	);
}

export function BaseNodeContent({
	className,
	...props
}: ComponentProps<"div">) {
	return (
		<div
			className={cn("flex flex-col gap-1 px-3 py-2", className)}
			{...props}
		/>
	);
}
