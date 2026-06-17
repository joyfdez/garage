export const FUEL_OPTIONS = [
  { value: "petrol",   label: "Petrol"   },
  { value: "diesel",   label: "Diesel"   },
  { value: "hybrid",   label: "Hybrid"   },
  { value: "electric", label: "Electric" },
  { value: "lpg",      label: "LPG"      },
  { value: "other",    label: "Other"    },
] as const;

export const DRIVETRAIN_OPTIONS = [
  { value: "fwd", label: "FWD" },
  { value: "rwd", label: "RWD" },
  { value: "awd", label: "AWD" },
  { value: "4wd", label: "4WD" },
] as const;

export const BODY_TYPE_OPTIONS = [
  { value: "sedan",       label: "Sedan"          },
  { value: "coupe",       label: "Coupé"          },
  { value: "hatchback",   label: "Hatchback"      },
  { value: "wagon",       label: "Wagon / Estate" },
  { value: "suv",         label: "SUV"            },
  { value: "pickup",      label: "Pickup"         },
  { value: "convertible", label: "Convertible"    },
  { value: "van",         label: "Van"            },
  { value: "other",       label: "Other"          },
] as const;

export const TRANSMISSION_OPTIONS = [
  { value: "manual",    label: "Manual"    },
  { value: "automatic", label: "Automatic" },
  { value: "semi_auto", label: "Semi-auto" },
  { value: "cvt",       label: "CVT"       },
  { value: "dct",       label: "DSG/DCT"   },
] as const;

export const ACQUISITION_OPTIONS = [
  { value: "daily",       label: "Daily driver"     },
  { value: "project",     label: "Project car"      },
  { value: "non_running", label: "Non-running"      },
  { value: "salvage",     label: "Salvage / parts"  },
  { value: "collection",  label: "Collection piece" },
] as const;

export const CURRENCIES = [
  { value: "EUR", symbol: "€",   label: "EUR" },
  { value: "USD", symbol: "$",   label: "USD" },
  { value: "MXN", symbol: "MX$", label: "MXN" },
  { value: "GBP", symbol: "£",   label: "GBP" },
  { value: "CHF", symbol: "CHF", label: "CHF" },
  { value: "JPY", symbol: "¥",   label: "JPY" },
] as const;

export const BASE_COLORS = [
  { value: "beige",   label: "Beige",   hex: "#C8B89A" },
  { value: "black",   label: "Black",   hex: "#1C1C1C" },
  { value: "blue",    label: "Blue",    hex: "#2563EB" },
  { value: "brown",   label: "Brown",   hex: "#78492A" },
  { value: "gold",    label: "Gold",    hex: "#C9A736" },
  { value: "gray",    label: "Gray",    hex: "#9CA3AF" },
  { value: "green",   label: "Green",   hex: "#16A34A" },
  { value: "maroon",  label: "Maroon",  hex: "#7F1D1D" },
  { value: "orange",  label: "Orange",  hex: "#EA580C" },
  { value: "pink",    label: "Pink",    hex: "#EC4899" },
  { value: "purple",  label: "Purple",  hex: "#9333EA" },
  { value: "red",     label: "Red",     hex: "#DC2626" },
  { value: "silver",  label: "Silver",  hex: "#B8BEC7" },
  { value: "violet",  label: "Violet",  hex: "#6D28D9" },
  { value: "white",   label: "White",   hex: "#F3F4F6" },
  { value: "yellow",  label: "Yellow",  hex: "#FBBF24" },
  { value: "other",   label: "Other",   hex: "#D1D5DB" },
] as const;

export type BaseColorValue = typeof BASE_COLORS[number]["value"];

// Years from 2027 down to 1900 for year-picker dropdowns.
export const YEAR_OPTIONS = Array.from(
  { length: 2027 - 1900 + 1 },
  (_, i) => 2027 - i
);

export type FuelValue         = typeof FUEL_OPTIONS[number]["value"];
export type DrivetrainValue   = typeof DRIVETRAIN_OPTIONS[number]["value"];
export type BodyTypeValue     = typeof BODY_TYPE_OPTIONS[number]["value"];
export type TransmissionValue = typeof TRANSMISSION_OPTIONS[number]["value"];
export type AcquisitionValue  = typeof ACQUISITION_OPTIONS[number]["value"];
export type CurrencyValue     = typeof CURRENCIES[number]["value"];
