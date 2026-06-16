export type MileageUnit = "km" | "mi";

export function convertMileage(value: number, from: MileageUnit, to: MileageUnit): number {
  if (from === to) return value;
  return from === "km"
    ? Math.round(value / 1.60934)
    : Math.round(value * 1.60934);
}

export function formatMileage(value: number, unit: MileageUnit): string {
  return `${value.toLocaleString("en-US")} ${unit}`;
}

export function toKm(value: number, unit: MileageUnit): number {
  return unit === "km" ? value : Math.round(value * 1.60934);
}
