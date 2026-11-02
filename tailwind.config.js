/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#14b8a6', // teal-500
        'brand-secondary': '#0f766e', // teal-700
        'base-100': '#1f2937', // gray-800
        'base-200': '#374151', // gray-700
        'base-300': '#4b5563', // gray-600
        'text-primary': '#f3f4f6', // gray-100
        'text-secondary': '#9ca3af', // gray-400
      },
    },
  },
  plugins: [],
}
