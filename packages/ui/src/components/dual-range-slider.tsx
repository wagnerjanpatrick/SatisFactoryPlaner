"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import { cn } from "@/lib/utils";

export type RankTick = {
  value: number; // position on the scale
  iconSrc?: string; // optional icon path
  label?: string; // optional small text
};

interface DualRangeSliderProps
  extends React.ComponentProps<typeof SliderPrimitive.Root> {
  // Floating value label for each thumb
  label?: (value: number | undefined) => React.ReactNode;
  // Side for floating labels
  labelPosition?: "top" | "bottom";
  // Visual checkpoints (no snapping unless you handle it in onValueCommit)
  ticks?: RankTick[];
  // Small vertical tick lines on the track (only shown when tickPosition === "over")
  showTickLines?: boolean;
  tickSizePx?: number;
  // Where to place the tick icons/text row relative to the track
  tickPosition?: "top" | "over" | "bottom";
  // Distance in px from the track when tickPosition is top/bottom
  tickOffsetPx?: number;
}

const TRACK_HEIGHT = 8; // keep in sync with the Track's inline style/class

const DualRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  DualRangeSliderProps
>(
  (
    {
      className,
      label,
      labelPosition = "bottom",
      ticks = [],
      showTickLines = true,
      tickSizePx = 7,
      tickPosition = "over",
      tickOffsetPx = 8,
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    // Derive values so we can render a thumb and label per value
    const values: number[] = (value as number[] | undefined) ??
      (defaultValue as number[] | undefined) ?? [Number(min), Number(max)];

    const pct = React.useCallback(
      (v: number) => ((v - Number(min)) / (Number(max) - Number(min))) * 100,
      [min, max]
    );

    // Ref to the actual track to anchor overlays precisely
    const trackRef = React.useRef<HTMLSpanElement | null>(null);
    const [trackHalf, setTrackHalf] = React.useState<number>(TRACK_HEIGHT / 2);

    React.useLayoutEffect(() => {
      const el = trackRef.current;
      if (!el) return;
      const update = () => {
        const rect = el.getBoundingClientRect();
        setTrackHalf(rect.height / 2 || TRACK_HEIGHT / 2);
      };
      update();
      // Resize observer for robustness
      const ro = new ResizeObserver(update);
      ro.observe(el);
      window.addEventListener("resize", update);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", update);
      };
    }, []);

    // Compute overlay positioning relative to the track center
    const tickRowStyle: React.CSSProperties =
      tickPosition === "over"
        ? { top: `calc(50% + ${trackHalf}px)` } // hugs the lower edge of the track
        : tickPosition === "top"
          ? { bottom: `calc(50% + ${trackHalf + tickOffsetPx}px)` } // above by offset
          : { top: `calc(50% + ${trackHalf + tickOffsetPx}px)` }; // below by offset

    const valueLabelStyle = (v: number): React.CSSProperties =>
      labelPosition === "top"
        ? {
            left: `${pct(v)}%`,
            bottom: `calc(50% + ${trackHalf + 10}px)`,
          }
        : {
            left: `${pct(v)}%`,
            top: `calc(50% + ${trackHalf + 10}px)`,
          };

    return (
      <div className={cn("relative w-full", className)}>
        {/* Wrapper defines a compact positioning area around the track */}
        <div
          className="relative w-full"
          style={{
            // 32px gives a little space above and below for icons/labels
            height: 32,
          }}
        >
          {/* Radix root fills wrapper; track is vertically centered */}
          <SliderPrimitive.Root
            className="absolute inset-0 flex w-full touch-none select-none items-center"
            defaultValue={defaultValue as number[] | undefined}
            max={max}
            min={min}
            ref={ref}
            step={step}
            value={value as number[] | undefined}
            {...props}
          >
            {/* Track */}
            <div className="relative flex w-full items-center justify-center">
              <SliderPrimitive.Track
                className="relative w-full overflow-hidden rounded-full bg-neutral-800"
                ref={trackRef}
                style={{ height: TRACK_HEIGHT }}
              >
                <SliderPrimitive.Range className="absolute h-full bg-orange-500" />
              </SliderPrimitive.Track>
            </div>

            {/* Thumbs */}
            {values.map((_, i) => (
              <SliderPrimitive.Thumb
                className="relative z-99 block h-4 w-4 rounded-full border-2 border-orange-500 bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                key={i}
              />
            ))}

            {/* Tick lines only when drawing 'over' the track */}
            {showTickLines && ticks.length > 0 && tickPosition === "over" && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-0"
                style={{ top: "50%", transform: "translateY(-50%)" }}
              >
                {ticks.map((t) => (
                  <div
                    className="absolute bg-orange-500/80"
                    key={`tick-line-${t.value}`}
                    style={{
                      left: `${pct(t.value)}%`,
                      width: 1.5,
                      height: tickSizePx,
                      transform: "translateX(-0.75px)",
                    }}
                  />
                ))}
              </div>
            )}
          </SliderPrimitive.Root>

          {/* Tick icon/label row (above/over/below the track) */}
          {ticks.length > 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0"
              style={tickRowStyle}
            >
              {ticks.map((t) => (
                <div
                  className="absolute -translate-x-1/2"
                  key={`tick-label-${t.value}`}
                  style={{ left: `${pct(t.value)}%` }}
                >
                  {t.iconSrc && (
                    <img
                      alt=""
                      className="mx-auto h-3.5 w-3.5 object-contain"
                      src={t.iconSrc}
                    />
                  )}
                  {t.label && (
                    <span className="mt-0.5 block text-[10px] text-neutral-300 leading-none">
                      {t.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DualRangeSlider.displayName = "DualRangeSlider";
export { DualRangeSlider };
