//scr/components/shared/ToastContainer.tsx
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils/cn'

const iconMap = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
  warning: AlertTriangle,
}

const colorMap = {
  success: 'border-emerald/30 text-emerald',
  error:   'border-error/30 text-error',
  info:    'border-info/30 text-info',
  warning: 'border-warning/30 text-warning',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => {
        const Icon = iconMap[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl surface-elevated border shadow-lg pointer-events-auto animate-slide-in-r',
              colorMap[toast.type]
            )}
            style={{ minWidth: '280px', maxWidth: '400px' }}
          >
            <Icon size={16} className="flex-shrink-0 mt-0.5" />
            <span className="flex-1 text-sm text-text-primary">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
