/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0f1115',
        sidebar: '#14171c',
        card: '#1a1d24',
        accent: '#6366f1',
      }
    },
  },
  plugins: [],
}