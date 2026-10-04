/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // igniise design tokens (design.md §2). Warm off-black family, locked dark.
        base: '#0E0D0B',
        raised: '#151310',
        inset: '#0A0908',
        hairline: {
          DEFAULT: '#26231E',
          strong: '#3A352D',
        },
        sage: '#7A8B6F',
        // shadcn semantic slots remapped onto the design palette
        border: '#26231E',
        input: '#26231E',
        ring: '#C9963F',
        background: '#0E0D0B',
        foreground: '#EDEAE3',
        primary: {
          DEFAULT: '#EDEAE3',
          foreground: '#141009',
        },
        secondary: {
          DEFAULT: '#A39C8E',
          foreground: '#EDEAE3',
        },
        muted: {
          DEFAULT: '#615C52',
          foreground: '#615C52',
        },
        accent: {
          DEFAULT: '#C9963F',
          dim: '#8A6B36',
          ink: '#141009',
          foreground: '#141009',
        },
        destructive: {
          DEFAULT: '#8C3B2E',
          foreground: '#EDEAE3',
        },
        popover: {
          DEFAULT: '#151310',
          foreground: '#EDEAE3',
        },
        card: {
          DEFAULT: '#151310',
          foreground: '#EDEAE3',
        },
        sidebar: {
          DEFAULT: '#0E0D0B',
          foreground: '#EDEAE3',
          primary: '#C9963F',
          'primary-foreground': '#141009',
          accent: '#151310',
          'accent-foreground': '#EDEAE3',
          border: '#26231E',
          ring: '#C9963F',
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
