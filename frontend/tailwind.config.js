/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: { 950: '#00251A', 900: '#004D40', 800: '#00695C', 700: '#00796B', 600: '#00897B', 100: '#B2DFDB', 50: '#E0F2F1' },
        coral: { 900: '#BF360C', 700: '#D84315', 500: '#FF5722' },
        orange: { 900: '#E65100', 700: '#EF6C00', 500: '#FF9800' },
        lime: { 900: '#33691E', 500: '#8BC34A', 100: '#C8E6C9', 50: '#F1F8E9' },
        paper: '#F5F0E8',
        ink: '#0D0D0D',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,.12)',
      },
    },
  },
  plugins: [],
};
