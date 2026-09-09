/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#fafafa",
        card: "#121215",
        "card-foreground": "#fafafa",
        primary: "#7c3aed",
        "primary-foreground": "#ffffff",
        secondary: "#1e1e24",
        "secondary-foreground": "#fafafa",
        muted: "#1e1e24",
        "muted-foreground": "#a1a1aa",
        border: "#27272a",
        input: "#27272a",
        destructive: "#dc2626",
      },
    },
  },
  plugins: [],
};
