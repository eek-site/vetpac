export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2A5C45',
          light: '#52B788',
          dark: '#1A3A2C',
        },
        accent: {
          DEFAULT: '#D4673A',
          light: '#E08E6B',
          dark: '#B04E25',
        },
        bg: {
          DEFAULT: '#F9F6F1',
          surface: '#FFFFFF',
        },
        border: '#E8E3DA',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#1C1917',
        textSecondary: '#44403C',
        textMuted: '#78716C',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        'card-lg': '20px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.07)',
        'card-hover': '0 10px 40px rgba(0,0,0,0.12)',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}
