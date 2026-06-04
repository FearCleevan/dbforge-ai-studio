import { useState } from 'react'
import { Settings, Keyboard, User, LogOut, Users, Clock, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ProjectSwitcher } from './ProjectSwitcher'
import { StatusDot } from '@/components/shared/StatusDot'
import { getStoredUser, clearAuth, isAuthenticated } from '@/lib/api/auth'
import { useProject } from '@/context/ProjectContext'
import { ShareDialog } from '@/features/collaboration/ShareDialog'
import { VersionHistory } from '@/features/collaboration/VersionHistory'

interface TopBarProps {
  onOpenShortcuts?: () => void
  onOpenHelp?:      () => void
}

export function TopBar({ onOpenShortcuts, onOpenHelp }: TopBarProps) {
  const navigate = useNavigate()
  const { currentProject } = useProject()
  const authed = isAuthenticated()
  const user = authed ? getStoredUser() : null
  const [showShare, setShowShare]     = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <>
    <header className="h-12 flex items-center justify-between px-4 bg-bg-surface border-b border-white/5 flex-shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 w-48">
        <div className="w-6 h-6 relative flex-shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-cyan/70" />
          <div className="absolute inset-[4px] rounded-full border border-violet/70" />
        </div>
        <span className="font-display font-semibold text-sm text-text-primary">DBForge</span>
        <span className="font-mono text-xs text-text-secondary">AI Studio</span>
      </div>

      {/* Center — Project Switcher */}
      <ProjectSwitcher />

      {/* Center-right — collaboration actions */}
      {currentProject && authed && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(true)}
            title="Version history"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
          >
            <Clock size={13} />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={() => setShowShare(true)}
            title="Share project"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-cyan bg-cyan/10 hover:bg-cyan/20 transition-colors"
          >
            <Users size={13} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      )}

      {/* Right — status + actions */}
      <div className="flex items-center gap-3 w-48 justify-end">
        <div className="flex items-center gap-1.5">
          <StatusDot status="online" />
          {user ? (
            <span className="text-xs text-text-secondary hidden sm:inline truncate max-w-[100px]">
              {user.name}
            </span>
          ) : (
            <span className="text-xs text-text-secondary hidden sm:inline">Demo Mode</span>
          )}
        </div>

        {user ? (
          <button
            type="button"
            title={`Logged in as ${user.email} — click to log out`}
            onClick={handleLogout}
            className="p-1.5 rounded-md text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
          >
            <LogOut size={15} />
          </button>
        ) : (
          <button
            type="button"
            title="Sign in"
            onClick={() => navigate('/login')}
            className="p-1.5 rounded-md text-text-tertiary hover:text-cyan hover:bg-cyan/10 transition-colors"
          >
            <User size={15} />
          </button>
        )}

        <button
          onClick={onOpenHelp}
          title="Help for current tool"
          className="p-1.5 rounded-md text-text-tertiary hover:text-cyan hover:bg-cyan/10 transition-colors"
        >
          <HelpCircle size={15} />
        </button>
        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (?)"
          className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
        >
          <Keyboard size={15} />
        </button>
        <button
          title="Settings"
          className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>

    {showShare && currentProject && (
      <ShareDialog projectId={currentProject.id} onClose={() => setShowShare(false)} />
    )}
    {showHistory && currentProject && (
      <VersionHistory
        projectId={currentProject.id}
        onClose={() => setShowHistory(false)}
      />
    )}
    </>
  )
}
