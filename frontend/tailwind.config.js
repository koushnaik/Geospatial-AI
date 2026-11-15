/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070d18',
          900: '#0b1329',
          800: '#111e38',
          700: '#1b2c4e',
          600: '#273f6b'
        }
      }
    },
  },
  plugins: [],
}
