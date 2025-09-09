/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Belangrijk voor je hoofdpagina
    "./src/**/*.{js,ts,jsx,tsx}", // Scant alleen in de 'src' map
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
