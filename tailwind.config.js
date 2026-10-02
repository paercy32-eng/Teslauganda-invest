/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F5F7FA',
          card: '#FFFFFF',
          navy: '#0A2540',
          navyDark: '#061829',
          cyan: '#00D9FF',
          cyanDark: '#00B8DB',
          border: '#E1E7EF',
          text: '#0A2540',
          muted: '#6B7A8F',
          success: '#00A86B',
          danger: '#E11D48',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
