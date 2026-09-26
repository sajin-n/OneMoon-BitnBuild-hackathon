/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./popup.html",
    "./sidepanel.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#070B12',
          900: '#0B0F19',
          800: '#111827',
          700: '#1F2937',
        }
      }
    },
  },
  plugins: [],
}
