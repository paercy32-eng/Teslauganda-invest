/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        safran: {
          bg: '#0F0F12',
          card: '#1A1A1F',
          cardSoft: '#15151A',
          copper: '#C8833A',
          copperLight: '#E0A44C',
          copperDark: '#8A5A28',
          text: '#F5F2ED',
          muted: '#8A8580',
          border: '#2A2823',
          success: '#4ADE80',
          danger: '#E5484D',
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
