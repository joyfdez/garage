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
