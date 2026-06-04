import React, { createContext, useContext, useState } from 'react'

export type ActiveTab = 'schema-designer' | 'visualizer' | 'query-editor' | 'api-checker' | 'connections'

interface UIState {
  activeTab:        ActiveTab
  sidebarCollapsed: boolean
  setActiveTab:     (tab: ActiveTab) => void
  toggleSidebar:    () => void
}

const UIContext = createContext<UIState | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('schema-designer')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <UIContext.Provider value={{ activeTab, sidebarCollapsed, setActiveTab, toggleSidebar: () => setSidebarCollapsed(v => !v) }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside UIProvider')
  return ctx
}
