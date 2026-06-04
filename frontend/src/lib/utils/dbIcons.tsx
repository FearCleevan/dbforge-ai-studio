import { Database, HardDrive, Layers, Flame } from 'lucide-react'

const ICON_MAP = {
  Database,
  HardDrive,
  Layers,
  Flame,
} as const

export type IconName = keyof typeof ICON_MAP

interface Props {
  name: IconName | string
  size?: number
  className?: string
}

export function DbIcon({ name, size = 12, className }: Props) {
  const Icon = ICON_MAP[name as IconName] ?? Database
  return <Icon size={size} className={className} />
}
