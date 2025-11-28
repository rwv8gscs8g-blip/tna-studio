import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          primary: "#FAF7F2",
          secondary: "#F6F1E8",
        },
        gold: {
          primary: "#C29B43",
          bright: "#D4AF37",
          dark: "#B3914B",
        },
        shadow: "#6E6251",
        black: {
          text: "rgba(27, 27, 27, 0.8)",
          title: "#1B1B1B",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Cormorant", "Cinzel", "Georgia", "serif"],
        sans: ["Inter", "Helvetica Now", "Lato", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
        "3xl": "4rem",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        "premium-sm": "0 1px 2px 0 rgba(110, 98, 81, 0.05)",
        "premium-md": "0 4px 6px -1px rgba(110, 98, 81, 0.1), 0 2px 4px -1px rgba(110, 98, 81, 0.06)",
        "premium-lg": "0 10px 15px -3px rgba(110, 98, 81, 0.1), 0 4px 6px -2px rgba(110, 98, 81, 0.05)",
        "premium-xl": "0 20px 25px -5px rgba(110, 98, 81, 0.1), 0 10px 10px -5px rgba(110, 98, 81, 0.04)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "350ms",
      },
    },
  },
  plugins: [],
};

export default config;

