import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  text: string
  size?: 'sm' | 'md'
  className?: string
}

export function CopyButton({ text, size = 'sm', className }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const iconSize = size === 'sm' ? 13 : 15

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      className={cn(
        'p-1.5 rounded-md transition-all duration-150',
        copied
          ? 'text-emerald bg-emerald/10'
          : 'text-text-tertiary hover:text-text-secondary hover:bg-white/5',
        className
      )}
    >
      {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
    </button>
  )
}
