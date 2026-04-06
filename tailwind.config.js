/**
 * Tailwind CSS configuration (v4-compatible minimal)
 * - Keeps content paths tight to src/ and app/ folders
 * - Uses the new `safelist` approach if you need runtime classes
 */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}',
    './src/app/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
