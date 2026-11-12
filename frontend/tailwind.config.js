/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#000615',
          DEFAULT: '#0B1F3A',
          navy: '#0B1F3A',
          light: '#1B355A',
        },
        secondary: {
          DEFAULT: '#006A63',
          teal: '#006A63',
          light: '#008B82',
          container: '#99EFE5',
        },
        surface: {
          DEFAULT: '#F8F9FF',
          background: '#F8F9FF',
          low: '#EFF4FF',
          container: '#E5EEFF',
          card: '#FFFFFF',
        },
        textColor: {
          primary: '#0B1C30',
          secondary: '#44474D',
          muted: '#75777E',
        },
        outlineBorder: '#75777E',
        danger: '#BA1A1A',
        success: '#1B873F',
        warning: '#D97706',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

