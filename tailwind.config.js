/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 移动端优先的断点
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
      }
    },
  },
  plugins: [],
}