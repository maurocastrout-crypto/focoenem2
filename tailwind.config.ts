/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: '#00e5a0',
        accent2: '#7F77DD',
        danger: '#ff4d6d',
        warn: '#f59e0b',
        surface: '#0a0f1e',
        surface2: '#111827',
        muted: '#6b7280',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
