/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand Accent ────────────────────────────────
        primary:   '#F07924',
        'primary-hover': '#D9650F',

        // ── Luxury Cream Palette ────────────────────────
        'cream':        '#FDF8F1',
        'cream-warm':   '#FFF7ED',
        'cream-border': '#FED7AA',
        'cream-card':   '#FFFFFF',

        // ── Legacy support ──────────────────────────────
        secondary:    '#86868b',
        'param-bg':   '#FDF8F1',
        'param-text': '#0F172A',
      },
      fontFamily: {
        serif: ["'Playfair Display'", 'serif'],
        sans:  ["'Inter'", 'sans-serif'],
      },
      screens: {
        xs: '400px',
      },
      boxShadow: {
        'cream-sm':  '0 2px 12px 0 rgba(240,121,36,0.06)',
        'cream-md':  '0 8px 30px -6px rgba(240,121,36,0.10)',
        'cream-lg':  '0 20px 60px -15px rgba(240,121,36,0.14)',
        'luxury':    '0 4px 24px -4px rgba(15,23,42,0.08)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
