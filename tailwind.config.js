/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // igniise design tokens v2 (design.md §2). Two registers, one brand:
        // PAPER on :root, TERMINAL under [data-register='terminal']. All
        // semantic colors are CSS-variable backed; Layout sets the register.
        base: 'rgb(var(--c-base) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        inset: 'rgb(var(--c-inset) / <alpha-value>)',
        hairline: {
          DEFAULT: 'rgb(var(--c-hairline) / <alpha-value>)',
          strong: 'rgb(var(--c-hairline-strong) / <alpha-value>)',
        },
        sage: 'rgb(var(--c-sage) / <alpha-value>)',
        wide: 'rgb(var(--c-wide) / <alpha-value>)',
        // shadcn semantic slots remapped onto the register tokens
        border: 'rgb(var(--c-hairline) / <alpha-value>)',
        input: 'rgb(var(--c-hairline) / <alpha-value>)',
        ring: 'rgb(var(--c-ring) / <alpha-value>)',
        background: 'rgb(var(--c-base) / <alpha-value>)',
        foreground: 'rgb(var(--c-primary) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)',
          foreground: 'rgb(var(--c-primary-fg) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--c-secondary) / <alpha-value>)',
          foreground: 'rgb(var(--c-primary) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--c-muted) / <alpha-value>)',
          foreground: 'rgb(var(--c-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          dim: 'rgb(var(--c-accent-dim) / <alpha-value>)',
          ink: 'rgb(var(--c-accent-ink) / <alpha-value>)',
          foreground: 'rgb(var(--c-accent-ink) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--c-destructive) / <alpha-value>)',
          foreground: 'rgb(var(--c-destructive-fg) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--c-popover) / <alpha-value>)',
          foreground: 'rgb(var(--c-popover-fg) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--c-card) / <alpha-value>)',
          foreground: 'rgb(var(--c-card-fg) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--c-base) / <alpha-value>)',
          foreground: 'rgb(var(--c-primary) / <alpha-value>)',
          primary: 'rgb(var(--c-accent) / <alpha-value>)',
          'primary-foreground': 'rgb(var(--c-accent-ink) / <alpha-value>)',
          accent: 'rgb(var(--c-raised) / <alpha-value>)',
          'accent-foreground': 'rgb(var(--c-primary) / <alpha-value>)',
          border: 'rgb(var(--c-hairline) / <alpha-value>)',
          ring: 'rgb(var(--c-ring) / <alpha-value>)',
        },
      },
      fontFamily: {
        serif: ['"Newsreader Variable"', 'Newsreader', 'Georgia', 'serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        // Shape Consistency Lock: all sharp (design.md §4)
        none: '0',
        xs: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px',
        DEFAULT: '0',
      },
      zIndex: {
        overlay: '30',
        drawer: '40',
        nav: '50',
        grain: '60',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "live-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "ticker-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "live-pulse": "live-pulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
