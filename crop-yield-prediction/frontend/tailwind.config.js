/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        field: { 50: "#f3f8f1", 100: "#e1eedc", 200: "#c4dcbb", 500: "#4f8a3c", 600: "#3f7230", 700: "#335c28", 800: "#2a4a23", 900: "#1f3a1b" },
        soil: { 50: "#faf8f5", 100: "#f1ede6", 200: "#e2dbcf", 500: "#8a7e6c", 700: "#5a5144", 900: "#2b2620" },
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
