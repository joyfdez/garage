"use client";

import { BASE_COLORS } from "@/lib/car-options";

interface ColorPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-2.5">
      {BASE_COLORS.map((color) => {
        const selected = value === color.value;
        const isLight = ["beige", "silver", "white", "gold"].includes(color.value);
        return (
          <button
            key={color.value}
            type="button"
            title={color.label}
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : color.value)}
            className="flex flex-col items-center gap-1 group focus:outline-none"
          >
            <span
              className={`
                block w-7 h-7 rounded-full transition-all
                ${isLight ? "border border-ink/15" : ""}
                ${selected
                  ? "ring-2 ring-offset-2 ring-accent scale-110"
                  : "hover:scale-110 hover:ring-2 hover:ring-offset-1 hover:ring-ink/20"
                }
              `}
              style={{ backgroundColor: color.hex }}
            />
            <span className={`text-[0.55rem] font-medium uppercase tracking-wide leading-none ${
              selected ? "text-ink" : "text-ink/40"
            }`}>
              {color.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
