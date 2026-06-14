"use client";

import Select, { StylesConfig } from "react-select";

interface Option {
  value: string;
  label: string;
}

const COUNTRIES: Option[] = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain",
  "Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso",
  "Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic",
  "Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba",
  "Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana",
  "Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania",
  "Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
  "Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine",
  "Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore",
  "Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea",
  "South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland",
  "Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia",
  "Zimbabwe",
].map((name) => ({ value: name, label: name }));

const selectStyles: StylesConfig<Option> = {
  control: (base, state) => ({
    ...base,
    background: "#EDEDED",
    border: "none",
    borderRadius: "12px",
    padding: "2px 4px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(26,58,46,0.2)" : "none",
    minHeight: "42px",
    cursor: "text",
  }),
  menu: (base) => ({
    ...base,
    background: "#FBFAF7",
    borderRadius: "12px",
    border: "1px solid rgba(17,17,17,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    zIndex: 50,
  }),
  menuList: (base) => ({
    ...base,
    padding: "4px",
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected
      ? "#1A3A2E"
      : state.isFocused
      ? "#EDEDED"
      : "transparent",
    color: state.isSelected ? "#FBFAF7" : "#111111",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer",
  }),
  placeholder: (base) => ({
    ...base,
    color: "rgba(17,17,17,0.3)",
    fontSize: "0.875rem",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#111111",
    fontSize: "0.875rem",
  }),
  input: (base) => ({
    ...base,
    color: "#111111",
    fontSize: "0.875rem",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  clearIndicator: (base) => ({
    ...base,
    color: "rgba(17,17,17,0.3)",
    padding: "4px",
    "&:hover": { color: "#111111" },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "rgba(17,17,17,0.3)",
    padding: "4px",
  }),
};

export function CountrySelect({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const defaultOption = defaultValue
    ? { value: defaultValue, label: defaultValue }
    : null;

  return (
    <Select
      name="country"
      instanceId="country-select"
      inputId="country-select-input"
      options={COUNTRIES}
      defaultValue={defaultOption}
      placeholder="Spain, Germany…"
      isClearable
      styles={selectStyles}
    />
  );
}
