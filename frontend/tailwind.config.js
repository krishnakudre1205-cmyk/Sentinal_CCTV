/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        police: {
          950: '#060b13',
          900: '#0a1120',
          850: '#0d172a',
          800: '#111f38',
          700: '#1b2d4f',
          600: '#264273',
          500: '#3862a8',
          400: '#5888d9',
        },
        cyber: {
          blue: '#00d2ff',
          cyan: '#00f2fe',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#8b5cf6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 210, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 210, 255, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
