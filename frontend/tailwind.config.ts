import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base':     '#1a1a1a',
        'bg-surface':  '#222222',
        'bg-elevated': '#2a2a2a',
        'bg-overlay':  '#313131',
        'bg-muted':    '#383838',
        cyan: {
          DEFAULT: '#9B8AF7',
          dim:     'rgba(155,138,247,0.10)',
          glow:    'rgba(155,138,247,0.12)',
        },
        violet: {
          DEFAULT: '#7965D4',
          dim:     'rgba(121,101,212,0.10)',
          glow:    'rgba(121,101,212,0.12)',
        },
        emerald: {
          DEFAULT: '#26D9C7',
          dim:     'rgba(38,217,199,0.10)',
        },
        'text-primary':   '#E6E1E5',
        'text-secondary': '#ABA7AF',
        'text-tertiary':  '#5C5760',
        'text-code':      '#C5B8FF',
        success: '#26D9C7',
        error:   '#F87171',
        warning: '#F59E0B',
        info:    '#60A5FA',
        border: {
          subtle:  'rgba(255,255,255,0.05)',
          default: 'rgba(255,255,255,0.09)',
          strong:  'rgba(255,255,255,0.15)',
        },
      },
      fontFamily: {
        ui:      ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        display: ['"Space Grotesk"', '"DM Sans"', 'sans-serif'],
      },
      fontSize: {
        xs:    ['11px', { lineHeight: '1.4' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['14px', { lineHeight: '1.6' }],
        md:    ['15px', { lineHeight: '1.6' }],
        lg:    ['18px', { lineHeight: '1.4' }],
        xl:    ['22px', { lineHeight: '1.3' }],
        '2xl': ['28px', { lineHeight: '1.2' }],
        '3xl': ['36px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        pill: '100px',
      },
      boxShadow: {
        sm:      '0 1px 2px rgba(0,0,0,0.5)',
        md:      '0 4px 12px rgba(0,0,0,0.6)',
        lg:      '0 8px 24px rgba(0,0,0,0.7)',
        cyan:    '0 0 16px rgba(155,138,247,0.15)',
        emerald: '0 0 16px rgba(38,217,199,0.15)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease forwards',
        'fade-up':    'fadeUp 0.35s ease forwards',
        'slide-in-r': 'slideInRight 0.3s ease forwards',
        'slide-in-l': 'slideInLeft 0.3s ease forwards',
        'shimmer':    'shimmer 1.8s linear infinite',
        'spin-slow':  'spin 3s linear infinite',
        'slide-up':   'slideUp 0.3s ease forwards',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp:       { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { transform: 'translateX(24px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        slideInLeft:  { from: { transform: 'translateX(-24px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
