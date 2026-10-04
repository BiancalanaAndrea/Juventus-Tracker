import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F7F7F5",      // near-white, primary text on dark bg
        chalk: "#141414",    // dark background (was off-white)
        steel: "#B8B8B5",    // light grey for secondary text on dark bg
        line: "#33332F",     // hairline borders on dark bg
        surface: "#232323",  // card / panel surface
        win: "#2FBE72",      // brighter green, more "pop"
        draw: "#E0A61A",     // brighter amber/gold
        loss: "#E14B4B",     // brighter red
        gold: "#C9A648",     // accent, used sparingly (trophies, highlights)
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
