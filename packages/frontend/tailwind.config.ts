import { type Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF",
        accent: "#000043",
        bg: {
          light: "#FFFFFF",
          muted: "#D9D9D9",
        },
        text: {
          base: "#29292B",
          muted: "#BABABA",
        },
        "gray-light": "#D9D9D9",
        "gray-dark": "#29292B",
        "blue-dark": "#000043",
        "blue-mid": "#1F1F4B",
        sand: "#F3EEE2",
        "sand-dark": "#E0D6C2",
        "accent-peach": "#FF6B6B",
        "accent-orange": "#FFB347",
        "brand-black": "#05050A",
        brace: {
          black: "#000000",
          slate: "#000043",
          zinc: "#28282A",
          lime: "#52913D",
          neutral: "#A2A2A2",
          surface: "#D9D9D9",
          white: "#FFFFFF",
          red300: "#ED9595",
          red600: "#FF0000",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
        brand: ['"Inter"', "system-ui", "sans-serif"],
        montserrat: ['"Montserrat"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "0.5rem",
        button: "9999px",
        input: "0.375rem",
        "3xl": "1.75rem",
        brace: "24px",
      },
      maxWidth: {
        "brace-container": "1080px",
      },
      spacing: {
        "brace-section": "34px",
      },
      fontSize: {
        h1: "45pt",
        h2: "35pt",
        h3: "20pt",
        display: ["96px", { lineHeight: "1", letterSpacing: "-0.03em" }],
        heading: ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        subheading: ["36px", { lineHeight: "1.1" }],
        body: ["30px", { lineHeight: "1.25" }],
        caption: ["20px", { lineHeight: "1.4" }],
      },
    },
  },
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
};

export default config;
