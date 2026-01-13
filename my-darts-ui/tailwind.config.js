/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Dart-specific sizes using clamp for better scaling across devices
        'dart-xs': ['clamp(0.75rem, 1.5vh, 1rem)', { lineHeight: '1.2' }],
        'dart-sm': ['clamp(0.875rem, 2vh, 1.125rem)', { lineHeight: '1.3' }],
        'dart-base': ['clamp(1rem, 2.5vh, 1.25rem)', { lineHeight: '1.4' }],
        'dart-lg': ['clamp(1.25rem, 3vh, 1.5rem)', { lineHeight: '1.3' }],
        'dart-xl': ['clamp(1.5rem, 4vh, 2rem)', { lineHeight: '1.2' }],
        'dart-2xl': ['clamp(2rem, 5vh, 3rem)', { lineHeight: '1.1' }],
        'dart-3xl': ['clamp(3rem, 7vh, 4rem)', { lineHeight: '1' }],
        'dart-score': ['clamp(4rem, 12vh, 8rem)', { lineHeight: '1' }],
      },
      spacing: {
        // Dart-specific spacing that scales with viewport
        'dart-compact': 'clamp(0.5rem, 1vh, 1rem)',
        'dart-normal': 'clamp(1rem, 2vh, 2rem)',
        'dart-spacious': 'clamp(2rem, 4vh, 4rem)',
      },
      minHeight: {
        'touch': '60px', // Minimum touch target size
      },
      minWidth: {
        'touch': '60px', // Minimum touch target size
      }
    },
  },
  plugins: [],
}