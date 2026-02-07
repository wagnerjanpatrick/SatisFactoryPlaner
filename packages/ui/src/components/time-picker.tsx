import { cn } from "../lib/utils";

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export default function TimePicker({
  value,
  onChange,
  className,
}: TimePickerProps) {
  return (
    <input
      className={cn(
        "w-full appearance-none rounded-md border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary",
        "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className
      )}
      onChange={(e) => onChange(e.target.value)}
      step={300}
      type="time"
      value={value} // 5 minute steps
    />
  );
}
