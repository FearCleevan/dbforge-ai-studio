import { cn } from '@/lib/utils/cn'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: 'cyan' | 'violet' | 'white'
  className?: string
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
const colorMap = {
  cyan:   'border-cyan/30 border-t-cyan',
  violet: 'border-violet/30 border-t-violet',
  white:  'border-white/20 border-t-white',
}

export function LoadingSpinner({ size = 'md', color = 'cyan', className }: Props) {
  return (
    <div
      className={cn('rounded-full border-2 animate-spin', sizeMap[size], colorMap[color], className)}
    />
  )
}
