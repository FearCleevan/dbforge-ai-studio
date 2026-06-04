import { cn } from '@/lib/utils/cn'

interface Props {
  status: 'online' | 'offline' | 'loading' | 'error'
  className?: string
}

const statusMap = {
  online:  'bg-emerald',
  offline: 'bg-text-tertiary',
  loading: 'bg-cyan animate-pulse',
  error:   'bg-error',
}

export function StatusDot({ status, className }: Props) {
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', statusMap[status], className)} />
  )
}
