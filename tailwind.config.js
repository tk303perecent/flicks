/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pleasant-grey': '#2D3748',
        'navbar-grey': '#1A202C',
        'accent-teal': '#38B2AC',
        'accent-teal-hover': '#319795',
        'light-text': '#E2E8F0',
        'medium-text': '#A0AEC0',
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar'), // <= ADD THIS LINE
  ],
}