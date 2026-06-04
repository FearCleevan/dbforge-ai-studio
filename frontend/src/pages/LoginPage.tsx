import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { loginUser, saveAuthLocally } from '@/lib/api/auth'
import { useToast } from '@/context/ToastContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await loginUser(email, password)
      saveAuthLocally(token, user)
      addToast(`Welcome back, ${user.name}!`, 'success')
      navigate('/studio')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Login failed. Check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-ui flex items-center justify-center px-4 relative">
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

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 rounded-full border-2 border-cyan/60" />
            <div className="absolute inset-[5px] rounded-full border border-violet/60" />
          </div>
          <span className="font-display font-semibold text-base text-text-primary">DBForge</span>
          <span className="font-mono text-xs text-text-secondary">AI Studio</span>
        </div>

        {/* Card */}
        <div className="surface-elevated rounded-xl p-8 shadow-lg border border-border-default">
          <h1 className="font-display font-semibold text-xl text-text-primary mb-1">Welcome back</h1>
          <p className="text-text-secondary text-sm mb-7">Sign in to your account to continue</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-default text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 transition-colors text-sm font-ui"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-bg-surface border border-border-default text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 transition-colors text-sm font-ui"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:shadow-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 mt-1"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : 'Sign in'
              }
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan hover:text-cyan/80 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-text-tertiary">
          Or{' '}
          <Link to="/studio" className="text-text-secondary hover:text-text-primary transition-colors">
            continue with demo mode
          </Link>
        </p>
      </div>
    </div>
  )
}
