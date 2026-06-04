import { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="p-4 rounded-xl bg-white/5 mb-4">
        <Icon size={32} className="text-text-tertiary" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      {description && <p className="text-text-secondary text-sm max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
