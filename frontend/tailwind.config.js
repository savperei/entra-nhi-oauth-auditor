/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--color-background)',
          surface: 'var(--color-surface)',
          subtle: 'var(--color-subtle)',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          dim: 'var(--color-text-dim)',
          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
          'accent-subtle': 'var(--color-accent-subtle)',
          'primary-dark': 'var(--color-primary-dark)',
          sidebar: 'var(--color-sidebar)',
          'sidebar-border': 'var(--color-sidebar-border)',
        },
        // Premium security palette
        forest: {
          950: '#0D1614',
          900: '#172622',
          850: '#202F2A',
          800: '#283C35',
          700: '#147D68',
          600: '#1FB196',
          500: '#2DD4BF',
          300: '#A7C4B5',
        },
        linen: {
          50: '#FFFFFF',
          100: '#FBFBF9',
          200: '#F5F4EF',
          300: '#ECEBE4',
          400: '#DCE2DB',
          500: '#97A8A0',
          600: '#66736C',
          700: '#202824',
        },
        // Semantic severity colors (restrained security)
        critical: '#C74444',
        high: '#D77928',
        medium: '#C59A32',
        low: '#39856A',
        none: '#66736C',
        // Backward-compatible token fallbacks
        bg: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        blue: '#147D68',
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#2DD4BF',
          600: '#1FB196',
          700: '#147D68',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
