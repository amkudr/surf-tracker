/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Apple-like Minimal Design System

      // Typography - System font stack for macOS/iOS
      fontFamily: {
        sans: [
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },

      // Typography Scale - Clear hierarchy with consistent line heights
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],        // 12px - captions
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],                              // 14px - small text
        'base': ['1rem', { lineHeight: '1.5rem' }],                                 // 16px - body text
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],                              // 18px - large body
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],                               // 20px - section titles
        '2xl': ['1.5rem', { lineHeight: '2rem' }],                                  // 24px - page titles
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],                             // 30px - large headings
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],                               // 36px - hero titles
        '5xl': ['3rem', { lineHeight: '1' }],                                       // 48px - display text

        // Legacy tokens for backwards compatibility
        'caption': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'body': ['0.875rem', { lineHeight: '1.25rem' }],
        'h4': ['1.125rem', { lineHeight: '1.75rem' }],
        'h3': ['1.25rem', { lineHeight: '1.75rem' }],
        'h2': ['1.5rem', { lineHeight: '2rem' }],
        'h1': ['1.875rem', { lineHeight: '2.25rem' }],
        'display': ['3rem', { lineHeight: '1' }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // Color Palette - Neutral-first with restrained ocean accent
      colors: {
        // Background - Near white
        background: {
          DEFAULT: '#ffffff',
          secondary: '#fafafa',
          tertiary: '#f5f5f5',
        },

        // Content - Neutral text hierarchy with improved contrast
        content: {
          primary: '#1d1d1f',    // High contrast for primary text
          secondary: '#3c3c43',  // Improved contrast for secondary text (WCAG AA)
          tertiary: '#636366',   // Better contrast for tertiary text
          quaternary: '#8e8e93', // Improved contrast for disabled/placeholder
        },

        // Accent - Single restrained ocean blue for primary actions
        accent: {
          DEFAULT: '#0071e3',    // Apple blue (restrained ocean)
          hover: '#0077ed',      // Slightly brighter on hover
          active: '#0056cc',     // Darker on active
          disabled: '#e6e6e6',    // Gray when disabled
        },

        // Semantic - Destructive only (red for delete/danger)
        destructive: {
          DEFAULT: '#d63031',    // Apple red
          hover: '#b91c1c',      // Darker red on hover
          active: '#991b1b',     // Even darker on active
        },

        // Border - Subtle separation
        border: {
          DEFAULT: '#d2d2d7',    // Light gray for borders
          secondary: '#e5e5ea',  // Even lighter for subtle borders
        },

        // Legacy support (map to new system)
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5ea',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#424245',
          700: '#1d1d1f',
          800: '#1d1d1f',
          900: '#1d1d1f',
        },

        // Ocean accent for legacy compatibility
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0071e3',
          600: '#0077ed',
          700: '#0056cc',
        },
      },

      // Spacing Scale - 4px-based grid (multiples of 0.25rem) for pixel-perfect alignment
      spacing: {
        '0': '0',
        '1': '0.25rem',  // 4px - smallest unit
        '2': '0.5rem',   // 8px
        '3': '0.75rem',  // 12px
        '4': '1rem',     // 16px
        '5': '1.25rem',  // 20px
        '6': '1.5rem',   // 24px
        '7': '1.75rem',  // 28px
        '8': '2rem',     // 32px
        '9': '2.25rem',  // 36px
        '10': '2.5rem',  // 40px
        '11': '2.75rem', // 44px
        '12': '3rem',    // 48px
        '14': '3.5rem',  // 56px
        '16': '4rem',    // 64px
        '18': '4.5rem',  // 72px
        '20': '5rem',    // 80px
        '24': '6rem',    // 96px
        '28': '7rem',    // 112px
        '32': '8rem',    // 128px
        '36': '9rem',    // 144px
        '40': '10rem',   // 160px
        '44': '11rem',   // 176px
        '48': '12rem',   // 192px
        '56': '14rem',   // 224px
        '64': '16rem',   // 256px
        '72': '18rem',   // 288px
        '80': '20rem',   // 320px
        '96': '24rem',   // 384px
      },

      // Border Radius - Consistent scale for different use cases
      borderRadius: {
        none: '0',
        sm: '0.25rem',     // 4px - small elements
        DEFAULT: '0.5rem', // 8px - most components
        md: '0.75rem',     // 12px - cards and larger elements
        lg: '1rem',        // 16px - page sections
        xl: '1.5rem',      // 24px - hero sections
        full: '9999px',    // For pills/buttons only
      },

      // Elevation - 2 levels maximum, very subtle
      boxShadow: {
        none: 'none',
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',  // Thin border-like shadow
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // Gentle depth
      },

      // Max Widths - Consistent container sizes
      maxWidth: {
        '8xl': '88rem',   // 1408px - extra large pages
        '9xl': '96rem',   // 1536px - ultra wide
      },

      // Focus Rings - Visible accessibility with better contrast
      ringColor: {
        DEFAULT: 'rgb(0 113 227 / 0.5)',  // Semi-transparent accent
        'focus': 'rgb(0 113 227)',        // Solid accent for strong focus
      },

      ringOffsetColor: {
        DEFAULT: '#ffffff',
      },

      ringOffsetWidth: {
        DEFAULT: '2px',
      },

      // Aspect Ratios - For consistent image sizing
      aspectRatio: {
        'square': '1 / 1',
        'video': '16 / 9',
        'portrait': '3 / 4',
        'landscape': '4 / 3',
        'wide': '21 / 9',
        'hero': '3 / 1',
      },

      // Transitions - Subtle, not heavy animation
      transitionDuration: {
        DEFAULT: '150ms',
        fast: '100ms',
        slow: '300ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Ease out
      },
    },
  },
  plugins: [],
}

