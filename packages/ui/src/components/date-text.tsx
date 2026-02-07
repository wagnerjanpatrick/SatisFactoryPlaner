"use client";
import { Calendar, Clock, Copy, ExternalLink } from "lucide-react";
// Text component to display a relative date and time with respect of the user's timezone and date format
import type React from "react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export const UserSettingsSchema = z.object({
  language: z.string(),
  region: z.string(),
  dateFormat: z.enum(["dmy", "mdy", "ymd"]),
  timeFormat: z.enum(["12h", "24h"]),
  timezone: z.string(),
});

export const DateMetadataSchema = z.object({
  dateTitle: z.string().optional(),
  dateDescription: z.string().optional(),
  url: z.string().url().optional(),
});

export const RelativeDatePropsSchema = z.object({
  timestamp: z.number(),
  className: z.string().optional(),
  durationSeconds: z.number().optional(),
  endTimestamp: z.number().optional(),
  activeLabel: z.string().optional(),
  settings: UserSettingsSchema.partial().optional(),
  metadata: DateMetadataSchema.optional(),
  enableContextMenu: z.boolean().optional(),
  customContextMenu: z
    .function()
    .args(
      z.object({
        onClose: z.function().returns(z.void()),
        onAddToCalendar: z.function().returns(z.void()),
        onCopyTimestring: z.function().returns(z.void()),
        onCopyTimestamp: z.function().returns(z.void()),
        metadata: DateMetadataSchema.optional(),
        position: z.object({ x: z.number(), y: z.number() }),
      })
    )
    .returns(z.any())
    .optional(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type DateMetadata = z.infer<typeof DateMetadataSchema>;
export type RelativeDateProps = z.infer<typeof RelativeDatePropsSchema>;

export function RelativeDate({
  timestamp,
  className = "",
  durationSeconds,
  endTimestamp,
  activeLabel = "currently active",
  settings: hardcodedSettings,
  metadata,
  enableContextMenu = true,
  customContextMenu,
}: RelativeDateProps) {
  const [localStorageSettings] = useLocalStorage<UserSettings>("userSettings", {
    language: "english",
    region: "emea",
    dateFormat: "dmy",
    timeFormat: "24h",
    timezone: "europe-berlin",
  });

  const settings = { ...localStorageSettings, ...hardcodedSettings };

  const [relativeTime, setRelativeTime] = useState("");
  const [fullDate, setFullDate] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();

      const calculatedEndTimestamp =
        endTimestamp || (durationSeconds ? timestamp + durationSeconds : null);

      if (calculatedEndTimestamp) {
        const isCurrentlyActive =
          now >= timestamp * 1000 && now <= calculatedEndTimestamp * 1000;
        setIsActive(isCurrentlyActive);

        if (isCurrentlyActive) {
          setRelativeTime(activeLabel);
          const startDate = new Date(timestamp * 1000);
          const endDate = new Date(calculatedEndTimestamp * 1000);
          setFullDate(
            `Active from ${formatDate(startDate)} to ${formatDate(endDate)}`
          );
          return;
        }
      }

      const diffInSeconds = Math.floor((timestamp * 1000 - now) / 1000);
      const absDiff = Math.abs(diffInSeconds);

      let relative = "";
      const isFuture = diffInSeconds > 0;

      if (absDiff <= 10 && isFuture) {
        relative = `in ${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""}`;
      } else if (absDiff < 60) {
        relative = isFuture ? "in a few seconds" : "just now";
      } else if (absDiff < 3600) {
        const minutes = Math.floor(absDiff / 60);
        relative = isFuture
          ? `in ${minutes} minute${minutes !== 1 ? "s" : ""}`
          : `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
      } else if (absDiff < 86_400) {
        const hours = Math.floor(absDiff / 3600);
        relative = isFuture
          ? `in ${hours} hour${hours !== 1 ? "s" : ""}`
          : `${hours} hour${hours !== 1 ? "s" : ""} ago`;
      } else if (absDiff < 604_800) {
        const days = Math.floor(absDiff / 86_400);
        relative = isFuture
          ? `in ${days} day${days !== 1 ? "s" : ""}`
          : `${days} day${days !== 1 ? "s" : ""} ago`;
      } else if (absDiff < 31_536_000) {
        const months = Math.floor(absDiff / 2_592_000);
        relative = isFuture
          ? `in ${months} month${months !== 1 ? "s" : ""}`
          : `${months} month${months !== 1 ? "s" : ""} ago`;
      } else {
        const years = Math.floor(absDiff / 31_536_000);
        relative = isFuture
          ? `in ${years} year${years !== 1 ? "s" : ""}`
          : `${years} year${years !== 1 ? "s" : ""} ago`;
      }

      setRelativeTime(relative);
      setFullDate(formatDate(new Date(timestamp * 1000)));
    };

    const formatDate = (date: Date) => {
      const timeZone = settings.timezone
        .split("-")
        .map((part, i) =>
          i === 0
            ? part.charAt(0).toUpperCase() + part.slice(1)
            : part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join("/");

      const formatter = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: settings.timeFormat === "12h",
        timeZone,
      });

      const parts = formatter.formatToParts(date);
      const weekday = parts.find((p) => p.type === "weekday")?.value || "";
      const day = parts.find((p) => p.type === "day")?.value || "";
      const month = parts.find((p) => p.type === "month")?.value || "";
      const year = parts.find((p) => p.type === "year")?.value || "";
      const hour = parts.find((p) => p.type === "hour")?.value || "";
      const minute = parts.find((p) => p.type === "minute")?.value || "";
      const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value || "";

      let dateString = "";
      if (settings.dateFormat === "dmy") {
        dateString = `${weekday} ${day}. ${month} ${year}`;
      } else if (settings.dateFormat === "mdy") {
        dateString = `${weekday} ${month} ${day}, ${year}`;
      } else {
        dateString = `${weekday} ${year}-${month}-${day}`;
      }

      const timeString =
        settings.timeFormat === "12h"
          ? `${hour}:${minute} ${dayPeriod}`
          : `${hour}:${minute}`;

      return `${dateString} at ${timeString}`;
    };

    updateTime();

    const now = Date.now();
    const diffInSeconds = Math.abs(Math.floor((timestamp * 1000 - now) / 1000));
    const updateInterval = diffInSeconds <= 60 ? 1000 : 10_000;

    const interval = setInterval(updateTime, updateInterval);

    return () => clearInterval(interval);
  }, [timestamp, durationSeconds, endTimestamp, activeLabel]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!enableContextMenu) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCopyTimestamp = () => {
    navigator.clipboard.writeText(timestamp.toString());
    setContextMenu(null);
  };

  const handleCopyTimestring = () => {
    navigator.clipboard.writeText(fullDate);
    setContextMenu(null);
  };

  const handleAddToCalendar = () => {
    const date = new Date(timestamp * 1000);
    const title = metadata?.dateTitle || "Event";
    const description = metadata?.dateDescription || "";
    const dateString =
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    // Google Calendar URL
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateString}/${dateString}&details=${encodeURIComponent(description)}`;

    window.open(calendarUrl, "_blank");
    setContextMenu(null);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <time
              aria-label={`${relativeTime}. Full date: ${fullDate}`}
              className={`cursor-help text-muted-foreground transition-colors hover:text-foreground ${isActive ? "font-medium text-green-600 dark:text-green-400" : ""} ${className}`}
              dateTime={new Date(timestamp * 1000).toISOString()}
              onContextMenu={handleContextMenu}
              role="time"
              tabIndex={0}
            >
              {relativeTime}
              <span className="sr-only">. Full date and time: {fullDate}</span>
            </time>
          </TooltipTrigger>
          <TooltipContent>
            <p aria-live="polite" className="font-medium" role="status">
              {fullDate}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {contextMenu && enableContextMenu && (
        <>
          {customContextMenu ? (
            customContextMenu({
              onClose: handleCloseContextMenu,
              onAddToCalendar: handleAddToCalendar,
              onCopyTimestring: handleCopyTimestring,
              onCopyTimestamp: handleCopyTimestamp,
              metadata,
              position: contextMenu,
            })
          ) : (
            <div
              aria-label="Date actions menu"
              className="fixed z-50 min-w-[200px] rounded-lg border border-border bg-popover py-1.5 shadow-lg"
              role="menu"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={handleAddToCalendar}
                role="menuitem"
              >
                <Calendar className="h-4 w-4" />
                <span>Add to calendar</span>
              </button>
              <button
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={handleCopyTimestring}
                role="menuitem"
              >
                <Copy className="h-4 w-4" />
                <span>Copy timestring</span>
              </button>
              <button
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={handleCopyTimestamp}
                role="menuitem"
              >
                <Clock className="h-4 w-4" />
                <span>Copy timestamp</span>
              </button>
              {metadata?.url && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <a
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    href={metadata.url}
                    rel="noopener noreferrer"
                    role="menuitem"
                    target="_blank"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open link</span>
                  </a>
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
