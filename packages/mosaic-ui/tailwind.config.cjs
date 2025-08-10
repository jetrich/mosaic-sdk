/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // GitHub Dark Mode Inspired
        background: "var(--color-bg-primary)",
        foreground: "var(--color-text-primary)",
        
        // MosAIc Design System Colors
        primary: {
          DEFAULT: "var(--color-accent-blue)",
          foreground: "var(--color-bg-primary)",
        },
        secondary: {
          DEFAULT: "var(--color-bg-secondary)",
          foreground: "var(--color-text-primary)",
        },
        destructive: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-text-primary)",
        },
        muted: {
          DEFAULT: "var(--color-bg-tertiary)",
          foreground: "var(--color-text-secondary)",
        },
        accent: {
          DEFAULT: "var(--color-accent-blue)",
          foreground: "var(--color-bg-primary)",
        },
        
        // Terminal Colors
        terminal: {
          green: "var(--color-accent-green)",
          red: "var(--color-accent-red)",
          yellow: "var(--color-accent-yellow)",
          blue: "var(--color-accent-blue)",
          bg: "var(--terminal-bg)",
          header: "var(--terminal-header)",
          text: "var(--terminal-text)",
          prompt: "var(--terminal-prompt)",
          cursor: "var(--terminal-cursor)",
        },
        
        // Syntax Highlighting
        syntax: {
          keyword: "var(--color-syntax-keyword)",
          string: "var(--color-syntax-string)",
          function: "var(--color-syntax-function)",
          comment: "var(--color-syntax-comment)",
          number: "var(--color-syntax-number)",
          property: "var(--color-syntax-property)",
          variable: "var(--color-syntax-variable)",
        },
        
        // UI Colors
        border: "var(--color-border)",
        ring: "var(--color-accent-blue)",
        
        // Additional colors for shadcn compatibility
        popover: {
          DEFAULT: "var(--color-bg-secondary)",
          foreground: "var(--color-text-primary)",
        },
        card: {
          DEFAULT: "var(--color-bg-secondary)",
          foreground: "var(--color-text-primary)",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)"],
        sans: ["var(--font-sans)"],
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
        "6xl": "var(--text-6xl)",
      },
      spacing: {
        0: "var(--space-0)",
        px: "var(--space-px)",
        0.5: "var(--space-0-5)",
        1: "var(--space-1)",
        1.5: "var(--space-1-5)",
        2: "var(--space-2)",
        2.5: "var(--space-2-5)",
        3: "var(--space-3)",
        3.5: "var(--space-3-5)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
        8: "var(--space-8)",
        9: "var(--space-9)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        14: "var(--space-14)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
        28: "var(--space-28)",
        32: "var(--space-32)",
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
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
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        pulse: {
          "0%": {
            boxShadow: "0 0 0 0 rgba(63, 185, 80, 0.7)",
          },
          "70%": {
            boxShadow: "0 0 0 8px rgba(63, 185, 80, 0)",
          },
          "100%": {
            boxShadow: "0 0 0 0 rgba(63, 185, 80, 0)",
          },
        },
        typing: {
          from: { width: "0" },
          to: { width: "100%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        blink: "blink 1.2s infinite",
        pulse: "pulse 2s infinite",
        typing: "typing 3s steps(30, end)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}