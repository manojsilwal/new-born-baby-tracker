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
        sage: {
          50: '#f4f7f5',
          100: '#e5ede8',
          200: '#cbdcd2',
          300: '#a3c2b0',
          400: '#7aa58d',
          500: '#588a70',
          600: '#446e59',
          700: '#375747',
          800: '#2e463a',
          900: '#273a31',
        },
        warmgray: {
          50: '#faf9f6',
          100: '#f5f3ee',
          200: '#e9e6df',
          300: '#d7d2c6',
          400: '#aba495',
          500: '#8a8272',
          600: '#6e6759',
          700: '#565045',
          800: '#3b372f',
          850: '#2c2923',
          900: '#1e1c18',
          950: '#151310',
        },
        charcoal: {
          700: '#33383f',
          800: '#25292e',
          850: '#1e2226',
          900: '#181b1e',
          950: '#121416',
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
