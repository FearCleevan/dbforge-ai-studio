import { useNavigate } from 'react-router-dom'
import { DEMO_PROJECT_ID } from '@/lib/constants'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="h-screen bg-bg-base flex flex-col items-center justify-center gap-4">
      <h1 className="font-display font-bold gradient-text-cyan" style={{ fontSize: '96px', lineHeight: 1 }}>
        404
      </h1>
      <p className="text-text-secondary text-lg">Page not found</p>
      <button
        onClick={() => navigate(`/studio/${DEMO_PROJECT_ID}`)}
        className="mt-4 px-6 py-2.5 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan text-sm font-medium hover:bg-cyan/20 transition-all"
      >
        Back to Studio
      </button>
    </div>
  )
}
