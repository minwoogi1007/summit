import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 메인 컬러 팔레트 - 따뜻하고 영적인 느낌
        summit: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d9c0',
          300: '#e9be96',
          400: '#de9c69',
          500: '#d5804a',
          600: '#c7683f',
          700: '#a55236',
          800: '#854432',
          900: '#6c3a2b',
          950: '#3a1c14',
        },
        // 보조 컬러 - 하늘/영적인 느낌
        spirit: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7dc8fc',
          400: '#38aaf8',
          500: '#0e8ee9',
          600: '#0270c7',
          700: '#0359a1',
          800: '#074c85',
          900: '#0c406e',
          950: '#082849',
        },
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
        diary: ['var(--font-nanum-pen)', 'cursive'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

