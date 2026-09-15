/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vanguard: {
          black:   '#000814',
          navy:    '#001D3D',
          blue:    '#003566',
          gold:    '#FFC300',
          yellow:  '#FFD60A',
          teal:    '#0E7490',
          violet:  '#5B21B6',
          indigo:  '#4338CA',
          rose:    '#E11D48',
          emerald: '#059669',
          surface: '#FFFFFF',
          canvas:  '#F4F6FB',
          card:    '#FFFFFF',
          border:  '#E2E8F0',
          muted:   '#64748B',
        },
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,29,61,0.05)',
        'card-md': '0 4px 20px rgba(0,29,61,0.08), 0 1px 4px rgba(0,0,0,0.06)',
        'glow-gold': '0 0 20px rgba(255,195,0,0.25)',
        'glow-blue': '0 0 20px rgba(0,53,102,0.15)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.35s ease-out both',
        'slide-in-right': 'slideInRight 0.3s ease-out both',
        'shimmer': 'shimmer 1.8s infinite linear',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
