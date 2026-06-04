import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { useUI } from '@/context/UIContext'
import { ActiveTab } from '@/context/UIContext'

const STORAGE_KEY = 'dbforge_onboarding_done'

interface Step {
  tab:         ActiveTab
  title:       string
  description: string
  tip:         string
  emoji:       string
}

const STEPS: Step[] = [
  {
    tab:         'schema-designer',
    title:       'Schema Designer',
    description: 'Describe your data model in plain English and watch DBForge generate a complete database schema instantly.',
    tip:         'Try: "E-commerce app with users, products, orders, and reviews"',
    emoji:       '🗄️',
  },
  {
    tab:         'visualizer',
    title:       'ER Visualizer',
    description: 'Explore your schema as an interactive entity-relationship diagram. Drag tables, zoom, and click nodes to inspect details.',
    tip:         'Click any table node to see column details and relationships.',
    emoji:       '🔗',
  },
  {
    tab:         'query-editor',
    title:       'Query Editor',
    description: 'Write and execute SQL with full AI assistance. Generate queries from natural language, optimize slow queries, and translate between SQL dialects.',
    tip:         'Press Ctrl+Enter to run your query.',
    emoji:       '⚡',
  },
  {
    tab:         'api-checker',
    title:       'API Checker',
    description: 'Test REST APIs with a full Postman-like interface. Write test scripts, run collections, and assert DB state after mutations.',
    tip:         'Use pm.test() in the Tests tab to write assertions.',
    emoji:       '🚀',
  },
]

export function OnboardingTour() {
  const { setActiveTab } = useUI()
  const [step, setStep]   = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      setTimeout(() => setVisible(true), 1000)
    }
  }, [])

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      setActiveTab(STEPS[step + 1].tab)
    } else {
      handleDone()
    }
  }

  function handlePrev() {
    if (step > 0) {
      setStep(s => s - 1)
      setActiveTab(STEPS[step - 1].tab)
    }
  }

  function handleDone() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  useEffect(() => {
    if (visible) setActiveTab(STEPS[step].tab)
  }, [step, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  const current = STEPS[step]

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-up">
      <div className="bg-bg-surface border border-cyan/20 rounded-2xl shadow-2xl shadow-cyan/10 overflow-hidden">
        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-cyan transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{current.emoji}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} className="text-cyan" />
                  <span className="text-[10px] font-mono text-cyan uppercase tracking-wider">
                    Step {step + 1} of {STEPS.length}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-text-primary">{current.title}</h3>
              </div>
            </div>
            <button
              onClick={handleDone}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed mb-3">{current.description}</p>

          <div className="flex items-start gap-2 bg-cyan/5 border border-cyan/10 rounded-lg px-3 py-2 mb-4">
            <span className="text-cyan text-[10px] mt-0.5">💡</span>
            <p className="text-[11px] text-text-secondary font-mono leading-relaxed">{current.tip}</p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={13} /> Back
            </button>

            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setStep(i); setActiveTab(STEPS[i].tab) }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? 'bg-cyan' : i < step ? 'bg-cyan/40' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan text-bg-base text-xs font-medium hover:bg-cyan/90 transition-colors"
            >
              {step === STEPS.length - 1 ? 'Get started' : 'Next'}
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
