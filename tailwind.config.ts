import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        card: "#EDEDED",
        ink: "#111111",
        // Magazine design system
        paper: "#FBFAF7",
        "racing-green": "#1A3A2E",
        accent: "#FF5A1F",
        "green-bright": "#2D6A4A",
        "ink-muted": "#6B6862",
        hint: "#A8A49C",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Archivo leads — bold, slightly compressed at high weights; Space Grotesk fallback
        display: ["var(--font-archivo)", "var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      borderRadius: {
        card: "16px",
        input: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
