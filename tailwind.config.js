/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/composables/**/*.{js,ts}',
    './app/app.vue'
  ],
  theme: {
    extend: {
      colors: {
        // Bảng màu chủ đạo (bắt buộc)
        kem: '#F5EFE0',       // be / kem
        dong: '#C9A356',      // vàng đồng
        do: '#8B2E2E',        // đỏ trầm
        go: '#4A3728',        // nâu gỗ
        'kem-dark': '#EAE1CC',
        'do-light': '#A54141'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Noto Serif"', 'serif'],
        noto: ['"Noto Serif"', 'serif'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 40px rgba(201,163,86,0.35)',
        'glow-lg': '0 0 80px rgba(201,163,86,0.4)',
        soft: '0 20px 60px -20px rgba(74,55,40,0.35)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        breathe: {
          '0%,100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' }
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        sway: {
          '0%,100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 1s ease-out both',
        breathe: 'breathe 5s ease-in-out infinite',
        'spin-slow': 'spin-slow 80s linear infinite',
        sway: 'sway 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
