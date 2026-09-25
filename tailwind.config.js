/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          bg: '#F7F8F5',
          card: '#FFFFFF',
          primary: '#7C9070',
          light: '#9CAF88',
          soft: '#E3E8DE',
          text: '#1F2A1B',
          muted: '#6B7A62',
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
