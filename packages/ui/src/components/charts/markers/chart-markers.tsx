"use client";

import { useCallback, useMemo } from "react";
import { chartCssVars, useChart } from "../chart-context";
import { type ChartMarker, MarkerGroup } from "./marker-group";

export type ChartMarkersProps = {
  /** Array of markers to display */
  items: ChartMarker[];
  /** Size of each marker circle. Default: 28 */
  size?: number;
  /** Whether to show vertical guide lines. Default: true */
  showLines?: boolean;
  /** Whether to animate markers on entrance. Default: true */
  animate?: boolean;
};

// Tooltip content for markers
export type MarkerTooltipContentProps = {
  markers: ChartMarker[];
};

const MAX_TOOLTIP_MARKERS = 2;

export function MarkerTooltipContent({ markers }: MarkerTooltipContentProps) {
  if (markers.length === 0) {
    return null;
  }

  const visibleMarkers = markers.slice(0, MAX_TOOLTIP_MARKERS);
  const hiddenCount = markers.length - MAX_TOOLTIP_MARKERS;

  return (
    <div className="mt-2 space-y-2 border-zinc-700/50 border-t pt-2">
      {visibleMarkers.map((marker, index) => {
        const isClickable = !!(marker.onClick || marker.href);
        const isTransparent = marker.color === "transparent";
        return (
          <div
            className="flex items-start gap-2"
            key={`${marker.title}-${index}`}
          >
            <div
              className={`flex flex-shrink-0 items-center justify-center ${isTransparent ? "h-6 w-6" : "h-5 w-5 rounded-full"}`}
              style={
                isTransparent
                  ? undefined
                  : {
                      backgroundColor:
                        marker.color || chartCssVars.markerBackground,
                      border: `1px solid ${chartCssVars.markerBorder}`,
                    }
              }
            >
              <span
                className="text-xs"
                style={
                  isTransparent
                    ? undefined
                    : { color: chartCssVars.markerForeground }
                }
              >
                {marker.icon}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              {marker.content ? (
                marker.content
              ) : (
                <>
                  <div className="flex items-center gap-1.5 truncate font-medium text-sm text-white">
                    {marker.title}
                    {isClickable && (
                      <span className="text-[10px] text-zinc-500">↗</span>
                    )}
                  </div>
                  {marker.description && (
                    <div className="truncate text-xs text-zinc-400">
                      {marker.description}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <div className="pl-7 text-xs text-zinc-500">+{hiddenCount} more...</div>
      )}
    </div>
  );
}

export function ChartMarkers({
  items,
  size = 28,
  showLines = true,
  animate = true,
}: ChartMarkersProps) {
  const {
    xScale,
    innerHeight,
    margin,
    containerRef,
    tooltipData,
    setTooltipData,
    animationDuration,
  } = useChart();

  // Hide the crosshair when hovering markers
  const handleMarkerHover = useCallback(
    (markers: ChartMarker[] | null) => {
      if (markers) {
        setTooltipData(null);
      }
    },
    [setTooltipData]
  );

  // Group markers by date
  const markersByDate = useMemo(() => {
    const grouped = new Map<string, ChartMarker[]>();
    for (const marker of items) {
      const dateKey = marker.date.toDateString();
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, marker]);
    }
    return grouped;
  }, [items]);

  // Y position for markers (above chart area)
  const markerY = -8;

  return (
    <>
      {Array.from(markersByDate.entries()).map(
        ([dateKey, dateMarkers], groupIndex) => {
          const markerDate = dateMarkers[0]?.date;
          if (!markerDate) {
            return null;
          }

          const markerX = xScale(markerDate) ?? 0;
          const isActive = tooltipData
            ? (() => {
                const point = tooltipData.point;
                const date =
                  point.date instanceof Date
                    ? point.date
                    : new Date(point.date as string | number);
                return date.toDateString() === dateKey;
              })()
            : undefined;

          const markerDelay = animate
            ? animationDuration / 1000 + groupIndex * 0.1
            : 0;

          return (
            <MarkerGroup
              animate={animate}
              animationDelay={markerDelay}
              containerRef={containerRef}
              isActive={isActive}
              key={dateKey}
              lineHeight={innerHeight}
              marginLeft={margin.left}
              marginTop={margin.top}
              markers={dateMarkers}
              onHover={handleMarkerHover}
              showLine={showLines}
              size={size}
              x={markerX}
              y={markerY}
            />
          );
        }
      )}
    </>
  );
}

// Hook to get active markers for tooltip
export function useActiveMarkers(items: ChartMarker[]) {
  const { tooltipData } = useChart();

  return useMemo(() => {
    if (!tooltipData) {
      return [];
    }
    const point = tooltipData.point;
    const date =
      point.date instanceof Date
        ? point.date
        : new Date(point.date as string | number);
    const dateKey = date.toDateString();
    return items.filter((m) => m.date.toDateString() === dateKey);
  }, [tooltipData, items]);
}

ChartMarkers.displayName = "ChartMarkers";
// Marker for SVG component detection (renders after mouse overlay for interaction)
(ChartMarkers as { __isChartMarkers?: boolean }).__isChartMarkers = true;
MarkerTooltipContent.displayName = "MarkerTooltipContent";

export default ChartMarkers;
