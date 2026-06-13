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
        // Legacy tokens — kept for screens not yet redesigned
        background: "#F6F6F4",
        card: "#EDEDED",
        ink: "#111111",
        orange: {
          DEFAULT: "#FF5A1F",
          50: "#FFF0EB",
          100: "#FFD9CC",
          500: "#FF5A1F",
          600: "#E64D15",
        },
        // Magazine design system
        paper: "#FBFAF7",
        "racing-green": "#1A3A2E",
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
