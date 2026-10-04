import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF9",
        line: "#E7E5E4",
        ink: "#1C1917",
        muted: "#78716C",
        accent: "#0F766E",
        danger: "#B91C1C",
        pending: "#D97706",
        blackout: "#57534E",
        closed: "#A8A29E",
      },
    },
  },
  plugins: [],
};

export default config;
