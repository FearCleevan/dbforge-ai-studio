import { useState } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { OnboardingTour } from '@/features/onboarding/OnboardingTour'
import { KeyboardShortcutsModal, useKeyboardShortcutsModal } from '@/features/onboarding/KeyboardShortcutsModal'
import { HelpModal } from '@/features/onboarding/HelpModal'
import { useUI } from '@/context/UIContext'

interface Props {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  const { activeTab } = useUI()
  const { open: shortcutsOpen, setOpen: setShortcutsOpen } = useKeyboardShortcutsModal()
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg-base">
      <TopBar
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>

      <OnboardingTour />

      {shortcutsOpen && (
        <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}

      {helpOpen && (
        <HelpModal tool={activeTab} onClose={() => setHelpOpen(false)} />
      )}
    </div>
  )
}
