import { useEffect, useState } from 'react'
import { X, Keyboard } from 'lucide-react'

interface Shortcut {
  keys:  string[]
  label: string
}

const SECTIONS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['1'],         label: 'Schema Designer' },
      { keys: ['2'],         label: 'ER Visualizer' },
      { keys: ['3'],         label: 'Query Editor' },
      { keys: ['4'],         label: 'API Checker' },
      { keys: ['5'],         label: 'Connections' },
      { keys: ['?'],         label: 'Keyboard shortcuts' },
      { keys: ['Esc'],       label: 'Close modal / panel' },
    ],
  },
  {
    title: 'Query Editor',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'],  label: 'Run query' },
      { keys: ['Ctrl', '/'],      label: 'Toggle comment' },
      { keys: ['Ctrl', 'Z'],      label: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], label: 'Redo' },
    ],
  },
  {
    title: 'Schema Designer',
    shortcuts: [
      { keys: ['Ctrl', 'S'],      label: 'Save schema' },
      { keys: ['Ctrl', 'Enter'],  label: 'Generate schema' },
    ],
  },
  {
    title: 'API Checker',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'],  label: 'Send request' },
      { keys: ['Ctrl', 'S'],      label: 'Save request' },
    ],
  },
]

function Key({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-white/20 bg-white/5 font-mono text-[10px] text-text-secondary min-w-[20px] justify-center">
      {k}
    </kbd>
  )
}

interface Props {
  onClose: () => void
}

export function KeyboardShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Keyboard size={15} className="text-cyan" />
            <span className="font-semibold text-sm text-text-primary">Keyboard Shortcuts</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider mb-2">{section.title}</h3>
              <div className="space-y-1">
                {section.shortcuts.map(({ keys, label }) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className="text-xs text-text-secondary">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <span key={k}>
                          <Key k={k} />
                          {i < keys.length - 1 && <span className="text-[10px] text-text-tertiary mx-0.5">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function useKeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === '?') {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return { open, setOpen }
}
