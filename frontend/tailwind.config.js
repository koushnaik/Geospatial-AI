/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: 'rgb(var(--color-navy-950) / <alpha-value>)', // Main Canvas Background
          900: 'rgb(var(--color-navy-900) / <alpha-value>)', // Elevated Panel / Card Background
          850: 'rgb(var(--color-navy-850) / <alpha-value>)', // Secondary Card / Surface Hover
          800: 'rgb(var(--color-navy-800) / <alpha-value>)', // Borders, Dividers, Neutral Badges
          750: 'rgb(var(--color-navy-750) / <alpha-value>)', // Sub-panel highlight
          700: 'rgb(var(--color-navy-700) / <alpha-value>)', // Muted Borders & Active Elements
          600: 'rgb(var(--color-navy-600) / <alpha-value>)', // Outline & Subtle Rings
        },
        cyan: {
          950: 'rgb(var(--color-cyan-950) / <alpha-value>)',
          900: 'rgb(var(--color-cyan-900) / <alpha-value>)',
          800: 'rgb(var(--color-cyan-800) / <alpha-value>)',
          600: '#0891B2',
          500: '#06B6D4',
          400: '#22D3EE',
          300: '#67E8F9',
        },
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        risk: {
          verylow: '#10B981',   // Emerald
          low: '#06B6D4',       // Cyan
          moderate: '#F59E0B',  // Amber
          high: '#F97316',      // Orange
          veryhigh: '#EF4444',  // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'panel': 'var(--shadow-panel)',
        'glow-cyan': 'var(--shadow-glow-cyan)',
        'glow-teal': 'var(--shadow-glow-teal)',
      }
    },
  },
  plugins: [],
};
