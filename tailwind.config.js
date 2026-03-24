/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0f1219",
          800: "#1a1b2e",
          700: "#2d2e4a",
        }
      }
    },
  },
  plugins: [],
}
