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
        "foreground-muted": "var(--foreground-muted)",
        "foreground-subtle": "var(--foreground-subtle)",
        
        // Surfaces
        surface: {
          base: "var(--surface-base)",
          elevated: "var(--surface-elevated)",
          overlay: "var(--surface-overlay)",
        },
        
        // Borders
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)",
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
          destructive: "rgb(var(--color-destructive) / <alpha-value>)",
          "destructive-muted": "rgb(var(--color-destructive-muted) / <alpha-value>)",
          info: "rgb(var(--color-info) / <alpha-value>)",
          "info-muted": "rgb(var(--color-info-muted) / <alpha-value>)",
        },
      },
      
      spacing: {
        "0": "var(--space-0)",
        "1": "var(--space-1)",
        "2": "var(--space-2)",
        "3": "var(--space-3)",
        "4": "var(--space-4)",
        "5": "var(--space-5)",
        "6": "var(--space-6)",
        "7": "var(--space-7)",
        "8": "var(--space-8)",
        "10": "var(--space-10)",
        "12": "var(--space-12)",
        "14": "var(--space-14)",
        "16": "var(--space-16)",
        "20": "var(--space-20)",
        "24": "var(--space-24)",
        sidebar: "280px",
        "sidebar-collapsed": "64px",
        topbar: "56px",
      },
      
      fontSize: {
        // Base scale (modular 1.25)
        xs: ["var(--text-xs)", { lineHeight: "1.5" }],
        sm: ["var(--text-sm)", { lineHeight: "1.5" }],
        base: ["var(--text-base)", { lineHeight: "1.6" }],
        md: ["var(--text-md)", { lineHeight: "1.6" }],
        lg: ["var(--text-lg)", { lineHeight: "1.5" }],
        xl: ["var(--text-xl)", { lineHeight: "1.4" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "1.3" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "1.2" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "1.1" }],
        
        // Semantic typography for learning content
        "h1": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],         // 32px - Page titles
        "h2": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],       // 24px - Sections
        "h3": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],      // 20px - Subsections
        "h4": ["1rem", { lineHeight: "1.5", fontWeight: "600" }],         // 16px - Minor groups
        
        // Body text
        "body": ["0.9375rem", { lineHeight: "1.6" }],                     // 15px - Main content
        "body-sm": ["0.8125rem", { lineHeight: "1.5" }],                  // 13px - Metadata, labels
        "body-xs": ["0.6875rem", { lineHeight: "1.4" }],                  // 11px - Badges, timestamps
        
        // Code
        "code": ["0.875rem", { lineHeight: "1.6" }],                      // 14px - Inline code
        "code-block": ["0.8125rem", { lineHeight: "1.6" }],               // 13px - Code blocks
      },
      
      lineHeight: {
        none: "var(--leading-none)",
        tight: "var(--leading-tight)",
        snug: "var(--leading-snug)",
        normal: "var(--leading-normal)",
        relaxed: "var(--leading-relaxed)",
        loose: "var(--leading-loose)",
      },
      
      letterSpacing: {
        tighter: "var(--tracking-tighter)",
        tight: "var(--tracking-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
      },
      
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "glow-purple-sm": "var(--glow-purple-sm)",
        "glow-purple-md": "var(--glow-purple-md)",
        "glow-purple-lg": "var(--glow-purple-lg)",
      },
      
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
      
      transitionTimingFunction: {
        DEFAULT: "var(--easing-default)",
        smooth: "var(--easing-smooth)",
        bounce: "var(--easing-bounce)",
      },
      
      zIndex: {
        base: "var(--z-base)",
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
        toast: "var(--z-toast)",
        overlay: "var(--z-overlay)",
      },
    },
  },
  plugins: [],
} satisfies Config;
