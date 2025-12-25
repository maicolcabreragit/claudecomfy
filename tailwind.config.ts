import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        // Surfaces
        surface: {
          base: "var(--surface-base)",
          elevated: "var(--surface-elevated)",
          overlay: "var(--surface-overlay)",
          border: "var(--surface-border)",
        },
        
        // Accent colors with alpha support
        accent: {
          purple: "rgb(var(--accent-purple) / <alpha-value>)",
          pink: "rgb(var(--accent-pink) / <alpha-value>)",
        },
        
        // Semantic colors with alpha support
        semantic: {
          success: "rgb(var(--color-success) / <alpha-value>)",
          "success-muted": "rgb(var(--color-success-muted) / <alpha-value>)",
          warning: "rgb(var(--color-warning) / <alpha-value>)",
          "warning-muted": "rgb(var(--color-warning-muted) / <alpha-value>)",
          error: "rgb(var(--color-error) / <alpha-value>)",
          "error-muted": "rgb(var(--color-error-muted) / <alpha-value>)",
          info: "rgb(var(--color-info) / <alpha-value>)",
          "info-muted": "rgb(var(--color-info-muted) / <alpha-value>)",
        },
      },
      
      spacing: {
        sidebar: "280px",
        "sidebar-collapsed": "64px",
        topbar: "56px",
      },
      
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        md: "var(--text-md)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
      },
      
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "glow-purple-sm": "var(--glow-purple-sm)",
        "glow-purple-md": "var(--glow-purple-md)",
        "glow-purple-lg": "var(--glow-purple-lg)",
        "glow-pink-sm": "var(--glow-pink-sm)",
        "glow-pink-md": "var(--glow-pink-md)",
      },
      
      transitionDuration: {
        fast: "var(--transition-fast)",
        normal: "var(--transition-normal)",
        slow: "var(--transition-slow)",
      },
      
      transitionTimingFunction: {
        smooth: "var(--easing-smooth)",
        bounce: "var(--easing-bounce)",
      },
    },
  },
  plugins: [],
} satisfies Config;
