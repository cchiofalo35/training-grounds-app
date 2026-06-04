/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#1E1E1E',
        'dark-grey': '#2A2A2A',
        // Brand accent — driven by --brand-accent-rgb (set per tenant in main.tsx)
        // so every `warm-accent` utility (incl. /opacity variants) follows the brand.
        'warm-accent': 'rgb(var(--brand-accent-rgb) / <alpha-value>)',
        steel: '#B0B5B8',
        'off-white': '#FAFAF8',
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
