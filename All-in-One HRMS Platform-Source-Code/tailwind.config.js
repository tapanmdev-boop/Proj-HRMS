/** @type {import('tailwindcss').Config} */

// ─── Ink & Champagne ────────────────────────────────────────────────────────
// One restrained palette for the whole portal. Structure is ink, surfaces are
// warm ivory, and champagne gold is the single accent. Status colours are
// deliberately desaturated so tables full of badges stay calm.

const ink = {
  50: '#F3F4F6',
  100: '#E5E7EC',
  200: '#C9CDD6',
  300: '#A2A8B5',
  400: '#737B8C',
  500: '#525A6B',
  600: '#3B4254',
  700: '#2A3142',
  800: '#1A2030',
  900: '#0F1420',
  950: '#0B0F19',
};

const ivory = {
  50: '#FBFAF7',
  100: '#F7F5F0',
  200: '#EFEBE3',
  300: '#E8E4DA',
  400: '#D6D1C5',
};

const gold = {
  50: '#FAF6EE',
  100: '#F3EAD8',
  200: '#E8D6B5',
  300: '#D9C29A',
  400: '#C4A574',
  500: '#B08D57',
  600: '#946F3F',
  700: '#75572F',
  800: '#5A4324',
  900: '#3F2F1A',
  950: '#261C0F',
};

// Warm neutral — replaces Tailwind's cool blue-grey so every existing
// `gray-*` class in the app sits naturally on ivory.
const warmGray = {
  50: '#FAF9F6',
  100: '#F3F1EC',
  200: '#E8E4DA',
  300: '#D6D1C5',
  400: '#A8A398',
  500: '#6E6A61',
  600: '#5B5850',
  700: '#44423C',
  800: '#2E2D29',
  900: '#1C1B18',
  950: '#121210',
};

const success = {
  50: '#F0F6F2',
  100: '#DDEBE2',
  200: '#BDD8C7',
  300: '#93BDA3',
  400: '#639C7C',
  500: '#3F7D5C',
  600: '#33694D',
  700: '#2A563F',
  800: '#224534',
  900: '#1B372A',
  950: '#0F2018',
};

const danger = {
  50: '#FBF1F1',
  100: '#F5E0E0',
  200: '#EAC0C1',
  300: '#DA9597',
  400: '#C4686B',
  500: '#A63D40',
  600: '#8F3336',
  700: '#772A2D',
  800: '#602326',
  900: '#4C1D1F',
  950: '#2B0F10',
};

const warning = {
  50: '#FBF6EB',
  100: '#F6E9CC',
  200: '#EDD49C',
  300: '#E1B96A',
  400: '#CE9A3F',
  500: '#B7791F',
  600: '#99641A',
  700: '#7B5016',
  800: '#604013',
  900: '#4A3210',
  950: '#2A1C08',
};

const info = {
  50: '#F0F3F8',
  100: '#DEE5EF',
  200: '#BFCDE0',
  300: '#97ADCB',
  400: '#6A87B0',
  500: '#3E5C8A',
  600: '#334C73',
  700: '#2A3E5E',
  800: '#22324B',
  900: '#1B283C',
  950: '#101826',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink,
        ivory,
        gold,
        success,
        danger,
        warning,
        info,
        // `brand-*` is used by older components — point it at the accent.
        brand: gold,

        // Remap Tailwind's stock hues onto the palette so the ~1,100 raw
        // colour classes across page files inherit the theme without a
        // file-by-file rewrite. New code should use the semantic names above.
        gray: warmGray,
        slate: warmGray,
        zinc: warmGray,
        neutral: warmGray,
        stone: warmGray,
        indigo: ink,
        purple: gold,
        violet: gold,
        fuchsia: gold,
        pink: gold,
        blue: info,
        sky: info,
        cyan: info,
        green: success,
        emerald: success,
        teal: success,
        lime: success,
        red: danger,
        rose: danger,
        yellow: warning,
        amber: warning,
        orange: warning,
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        display: ['Fraunces', 'Georgia', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        hairline: '0 0 0 1px #E8E4DA',
        'premium-sm': '0 1px 2px 0 rgba(15, 20, 32, 0.04)',
        'premium-md': '0 1px 2px 0 rgba(15, 20, 32, 0.04), 0 4px 12px -2px rgba(15, 20, 32, 0.06)',
        'premium-lg': '0 2px 4px 0 rgba(15, 20, 32, 0.04), 0 16px 40px -8px rgba(15, 20, 32, 0.14)',
      },
      borderRadius: {
        btn: '0.5rem',
      },
    },
  },
  plugins: [],
};
