import { useTheme } from './ThemeContext.jsx'

const OPTIONS = [
  { value: 'light', label: '☀ Light' },
  { value: 'auto',  label: '⬤ Auto'  },
  { value: 'dark',  label: '☾ Dark'  },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-toggle" role="group" aria-label="Colour theme">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          className={`theme-btn${theme === value ? ' active' : ''}`}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
