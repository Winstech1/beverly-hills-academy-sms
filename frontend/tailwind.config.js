/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0b1c3a',
          900: '#0f2249',
          800: '#15305f',
          700: '#1c3d76',
        },
        brand: {
          blue: '#2563eb',
          green: '#16a34a',
          amber: '#f59e0b',
          purple: '#7c3aed',
          red: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};
