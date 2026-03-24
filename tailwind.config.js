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
          900: "#f9fafb",
          800: "#ffffff",
          700: "#f3f4f6",
          600: "#e5e7eb",
        },
        gold: '#C9A96E',
        'gold-strong': '#B8943F',
      }
    },
  },
  plugins: [],
}
