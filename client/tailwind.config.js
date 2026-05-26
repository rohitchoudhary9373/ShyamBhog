/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ea580c", // Deep orange
        secondary: "#86868b",
        "param-bg": "#fefaf4",
        "param-text": "#3e2723",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      screens: {
        'xs': '400px',
      }
    },
  },
  plugins: [],
}
