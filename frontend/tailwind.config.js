/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        surface: {
          light: '#ffffff',
          'light-subtle': '#f9fafb',
          'light-border': '#e5e7eb',
          dark: '#1f2937',
          'dark-subtle': '#111827',
          'dark-border': '#374151',
        },
        content: {
          primary: '#111827',
          secondary: '#4b5563',
          tertiary: '#6b7280',
          'primary-dark': '#f9fafb',
          'secondary-dark': '#9ca3af',
          'tertiary-dark': '#6b7280',
        },
        accent: {
          blue: {
            bg: '#eff6ff',
            bgDark: 'rgba(59, 130, 246, 0.2)',
            text: '#1d4ed8',
            textDark: '#60a5fa',
          },
          green: {
            bg: '#f0fdf4',
            bgDark: 'rgba(34, 197, 94, 0.2)',
            text: '#16a34a',
            textDark: '#4ade80',
          },
          yellow: {
            bg: '#fefce8',
            bgDark: 'rgba(234, 179, 8, 0.2)',
            text: '#ca8a04',
            textDark: '#facc15',
          },
          red: {
            bg: '#fef2f2',
            bgDark: 'rgba(239, 68, 68, 0.2)',
            text: '#dc2626',
            textDark: '#f87171',
          },
          purple: {
            bg: '#faf5ff',
            bgDark: 'rgba(168, 85, 247, 0.2)',
            text: '#9333ea',
            textDark: '#c084fc',
          },
        }
      },
    },
  },
  plugins: [],
}
