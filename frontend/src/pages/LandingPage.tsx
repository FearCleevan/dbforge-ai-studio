import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, GitBranch, Terminal, Zap, Users, Rocket, ArrowRight, Play } from 'lucide-react'
import { DEMO_PROJECT_ID } from '@/lib/constants'

const TYPEWRITER_LINES = [
  '> Describe your database in plain English...',
  '> "E-commerce platform with users, products, orders"',
  '',
  '-- AI generating schema...',
  '',
  'CREATE TABLE users (',
  '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
  '  email VARCHAR(255) NOT NULL UNIQUE,',
  '  name VARCHAR(255) NOT NULL,',
  '  created_at TIMESTAMP DEFAULT NOW()',
  ');',
  '',
  'CREATE TABLE products (',
  '  id UUID PRIMARY KEY,',
  '  name VARCHAR(255) NOT NULL,',
  '  price DECIMAL NOT NULL,',
  '  ...',
]

const FEATURES = [
  {
    icon: Database,
    title: 'Schema Designer',
    desc: 'Generate database schemas from plain English prompts. Edit tables and columns inline.',
    accent: 'cyan',
    phase: null,
  },
  {
    icon: GitBranch,
    title: 'ER Visualizer',
    desc: 'Interactive entity-relationship diagrams with auto-layout powered by Dagre.',
    accent: 'violet',
    phase: null,
  },
  {
    icon: Terminal,
    title: 'Query Editor',
    desc: 'Monaco-powered SQL editor with AI generation, explain plans, and optimization tips.',
    accent: 'emerald',
    phase: null,
  },
  {
    icon: Zap,
    title: 'API Checker',
    desc: 'Test REST endpoints, chain API flows, and auto-generate test suites.',
    accent: 'info',
    phase: null,
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Share schemas and queries with your team. Real-time collaboration coming soon.',
    accent: 'warning',
    phase: 'Phase 6',
  },
  {
    icon: Rocket,
    title: 'Export & Deploy',
    desc: 'Export DDL, Prisma schemas, or deploy migrations directly to your database.',
    accent: 'secondary',
    phase: 'Coming Soon',
  },
]

const accentClasses: Record<string, { border: string; icon: string; badge: string }> = {
  cyan:      { border: 'border-cyan/20 hover:border-cyan/40', icon: 'text-cyan', badge: 'bg-cyan/10 text-cyan border-cyan/20' },
  violet:    { border: 'border-violet/20 hover:border-violet/40', icon: 'text-violet', badge: 'bg-violet/10 text-violet border-violet/20' },
  emerald:   { border: 'border-emerald/20 hover:border-emerald/40', icon: 'text-emerald', badge: 'bg-emerald/10 text-emerald border-emerald/20' },
  info:      { border: 'border-info/20 hover:border-info/40', icon: 'text-info', badge: 'bg-info/10 text-info border-info/20' },
  warning:   { border: 'border-warning/20 hover:border-warning/40', icon: 'text-warning', badge: 'bg-warning/10 text-warning border-warning/20' },
  secondary: { border: 'border-white/10 hover:border-white/20', icon: 'text-text-secondary', badge: 'bg-white/5 text-text-secondary border-white/10' },
}

export function LandingPage() {
  const navigate = useNavigate()
  const [visibleLines, setVisibleLines] = useState(0)

  // Body has overflow:hidden for the Studio shell — restore scroll on Landing
  useEffect(() => {
    document.body.style.overflow = 'auto'
    return () => { document.body.style.overflow = 'hidden' }
  }, [])

  useEffect(() => {
    if (visibleLines >= TYPEWRITER_LINES.length) return
    const t = setTimeout(() => setVisibleLines(v => v + 1), visibleLines < 3 ? 80 : 40)
    return () => clearTimeout(t)
  }, [visibleLines])

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-ui relative">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradient orbs */}
      {/* <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-cyan/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-violet/5 blur-[120px] pointer-events-none" /> */}

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 relative">
            <div className="absolute inset-0 rounded-full border-2 border-cyan/60" />
            <div className="absolute inset-[5px] rounded-full border border-violet/60" />
          </div>
          <span className="font-display font-semibold text-base text-text-primary">DBForge</span>
          <span className="font-mono text-xs text-text-secondary ml-1">AI Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/studio/${DEMO_PROJECT_ID}`)}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Demo
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Log in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-1.5 rounded-pill bg-cyan/10 border border-cyan/30 text-cyan text-sm font-medium hover:bg-cyan/20 transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-cyan/30 bg-cyan/5 mb-8 animate-fade-up">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
          <span className="font-mono text-xs text-cyan tracking-wide">NEW · AI-Powered Schema Generation</span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold leading-tight mb-4 animate-fade-up" style={{ fontSize: '56px', animationDelay: '60ms' }}>
          Design Databases.<br />
          <span className="text-text-primary">Ship Faster.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-text-secondary text-lg max-w-xl mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '120ms' }}>
          Generate schemas from plain English, visualize relationships, test APIs, and write queries — all in one AI-powered studio.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4 mb-14 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:opacity-90 transition-all duration-250 hover:scale-[1.02]"
          >
            Get Started <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/studio/${DEMO_PROJECT_ID}`)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-text-secondary text-sm hover:text-text-primary hover:border-white/20 transition-all"
          >
            <Play size={14} /> View Demo
          </button>
        </div>

        {/* Code preview card */}
        <div className="w-full max-w-2xl surface-elevated rounded-xl p-5 text-left animate-fade-up shadow-lg" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-error/60" />
            <div className="w-3 h-3 rounded-full bg-warning/60" />
            <div className="w-3 h-3 rounded-full bg-emerald/60" />
            <span className="ml-3 font-mono text-xs text-text-tertiary">schema-generator.sql</span>
          </div>
          <pre className="font-mono text-xs leading-relaxed min-h-[200px]">
            {TYPEWRITER_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i}>
                {line.startsWith('--') ? (
                  <span className="text-text-tertiary">{line}</span>
                ) : line.startsWith('>') ? (
                  <span className="text-emerald">{line}</span>
                ) : line.startsWith('CREATE') || line.startsWith(');') ? (
                  <span style={{ color: '#C678DD' }}>{line}</span>
                ) : line.includes('UUID') || line.includes('VARCHAR') || line.includes('TIMESTAMP') || line.includes('DECIMAL') ? (
                  <span>
                    <span className="text-text-secondary">{line.split(/([A-Z]+(?:\(\d+\))?)/)[0]}</span>
                    {line.split(/\s+/).map((word, wi) => (
                      ['UUID', 'VARCHAR(255)', 'VARCHAR', 'TIMESTAMP', 'DECIMAL', 'NOT', 'NULL', 'UNIQUE', 'DEFAULT', 'PRIMARY', 'KEY'].includes(word.replace(/[,()]/g, ''))
                        ? <span key={wi} style={{ color: '#61AFEF' }}>{word} </span>
                        : <span key={wi} className="text-text-secondary">{word} </span>
                    ))}
                  </span>
                ) : line ? (
                  <span className="text-text-code">{line}</span>
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>
            ))}
            {visibleLines < TYPEWRITER_LINES.length && (
              <span className="inline-block w-2 h-4 bg-cyan animate-pulse ml-0.5" />
            )}
          </pre>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 px-6 pb-20 max-w-5xl mx-auto">
        <h2 className="text-center font-display font-semibold text-xl text-text-secondary mb-10 tracking-wide uppercase text-xs">
          Everything you need to design, visualize & test
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const cls = accentClasses[f.accent]
            return (
              <div
                key={f.title}
                className={`surface rounded-xl p-5 border transition-all duration-250 ${cls.border} ${f.phase ? 'opacity-60' : 'cursor-pointer hover:shadow-md'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-white/5 ${cls.icon}`}>
                    <f.icon size={18} />
                  </div>
                  {f.phase && (
                    <span className={`text-xs px-2 py-0.5 rounded-pill border font-mono ${cls.badge}`}>
                      {f.phase}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-base text-text-primary mb-1.5">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-6 text-center">
        <p className="text-text-tertiary font-ui" style={{ fontSize: '12px' }}>
          DBForge AI Studio · Built for developers · Open source friendly
        </p>
      </footer>
    </div>
  )
}
