/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Use simple color definitions for now - will expand later
      colors: {
        primary: '#22c55e',
        expense: '#ef4444', 
        income: '#22c55e',
        food: '#f59e0b',
        transport: '#3b82f6',
        entertainment: '#8b5cf6',
        shopping: '#ec4899',
        bills: '#ef4444',
        healthcare: '#10b981',
        education: '#6366f1',
        travel: '#06b6d4',
      }
    },
  },
  plugins: [],
}