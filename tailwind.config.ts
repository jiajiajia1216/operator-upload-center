/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F9E72C',
          light: '#FDF8D8',
          dark: '#D4C524',
        },
        accent: {
          DEFAULT: '#3D3A39',
          light: '#6B6664',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        brand: {
          yellow: '#F9E72C',
          dark: '#3D3A39',
          bg: '#F5F5F5',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      borderRadius: {
        'brand': '16px',
        'brand-sm': '10px',
      },
    },
  },
  plugins: [],
}