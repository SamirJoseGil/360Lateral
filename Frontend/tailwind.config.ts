import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lateral: {
          50: "#F5F7FB",
          100: "#E9EEF6",
          200: "#C7D3E9",
          300: "#93A6CF",
          400: "#5D7AB6",
          500: "#2E4E9D", // Color primario
          600: "#1A3A87",
          700: "#132C70",
          800: "#0E1F50",
          900: "#091638",
        },
        naranja: {
          500: "#FF6B35", // Color acentuado/secundario
          600: "#E85A24",
        },
        gris: {
          100: "#F7F7F7",
          200: "#E6E6E6",
          300: "#D5D5D5",
          400: "#B0B0B0",
          500: "#7B7B7B",
          600: "#555555",
          700: "#333333",
          800: "#1F1F1F",
          900: "#121212",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
        display: [
          "Montserrat",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        lateral: "0 4px 20px rgba(46, 78, 157, 0.15)",
      },
      backgroundImage: {
        "gradient-lateral": "linear-gradient(135deg, #2E4E9D 0%, #1A3A87 100%)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
} satisfies Config;
