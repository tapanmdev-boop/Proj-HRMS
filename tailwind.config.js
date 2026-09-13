/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Semantic color tokens — one source of truth for Button/Badge/Alert/Toast
      // instead of each component picking its own raw indigo-600/blue-600/etc.
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
        },
      },
      // "Premium" button feel: soft layered shadows + a slightly larger
      // default radius, used by the shared <Button> component.
      boxShadow: {
        'premium-sm': '0 1px 2px 0 rgba(17, 24, 39, 0.06), 0 1px 1px 0 rgba(17, 24, 39, 0.04)',
        'premium-md': '0 2px 4px -1px rgba(17, 24, 39, 0.08), 0 4px 8px -2px rgba(17, 24, 39, 0.06)',
        'premium-lg': '0 8px 16px -4px rgba(17, 24, 39, 0.12), 0 4px 6px -2px rgba(17, 24, 39, 0.06)',
      },
      borderRadius: {
        btn: '0.625rem',
      },
    },
  },
  plugins: [],
};
