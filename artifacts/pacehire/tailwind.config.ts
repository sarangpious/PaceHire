import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        border: 'var(--color-border)',
        brand: 'var(--color-brand)',
        'brand-light': 'var(--color-brand-light)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        green: 'var(--color-green)',
        amber: 'var(--color-amber)',
        red: 'var(--color-red)',
      },
    },
  },
  plugins: [forms],
}

export default config
