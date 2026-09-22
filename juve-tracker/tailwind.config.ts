import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",      // near-black, primary
        chalk: "#F7F7F5",    // off-white background
        steel: "#3A3D42",    // dark grey for secondary text
        line: "#D8D8D5",     // hairline borders
        win: "#1F7A4D",      // muted green
        draw: "#B8860B",     // muted amber/gold
        loss: "#B33A3A",     // muted red
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
