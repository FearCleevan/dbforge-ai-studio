import { useState, useEffect, useCallback } from 'react'
import { X, Users, Link2, Copy, Check, UserPlus, Trash2, Loader2 } from 'lucide-react'
import { Workspace, WorkspaceMember, ProjectShare, MemberRole } from '@/types/collaboration'
import {
  listWorkspaces,
  createWorkspace,
  getProjectShare,
  getWorkspaceMembers,
  shareProject,
  inviteMember,
  removeMember,
} from '@/lib/api/workspace'
import { cn } from '@/lib/utils/cn'

interface Props {
  projectId: string
  onClose: () => void
}

const ROLE_LABELS: Record<Exclude<MemberRole, 'owner'>, string> = {
  admin:  'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

export function ShareDialog({ projectId, onClose }: Props) {
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [workspaces, setWorkspaces]       = useState<Workspace[]>([])
  const [selectedWs, setSelectedWs]       = useState<string>('')
  const [share, setShare]                 = useState<ProjectShare | null>(null)
  const [members, setMembers]             = useState<WorkspaceMember[]>([])
  const [inviteEmail, setInviteEmail]     = useState('')
  const [inviteRole, setInviteRole]       = useState<Exclude<MemberRole, 'owner'>>('editor')
  const [linkEnabled, setLinkEnabled]     = useState(false)
  const [copied, setCopied]               = useState(false)
  const [newWsName, setNewWsName]         = useState('')
  const [creatingWs, setCreatingWs]       = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [wsList, shareData] = await Promise.all([
        listWorkspaces(),
        getProjectShare(projectId).catch(() => ({ share: null, members: [] })),
      ])
      setWorkspaces(wsList)
      setShare(shareData.share)
      setMembers(shareData.members)
      if (shareData.share) {
        setSelectedWs(shareData.share.workspaceId)
        setLinkEnabled(shareData.share.linkSharingEnabled)
      } else if (wsList.length > 0) {
        setSelectedWs(wsList[0]._id)
      }
    } catch {
      setError('Failed to load sharing info')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  async function handleCreateWorkspace() {
    if (!newWsName.trim()) return
    setCreatingWs(true)
    try {
      const ws = await createWorkspace(newWsName.trim())
      setWorkspaces(prev => [...prev, ws])
      setSelectedWs(ws._id)
      setNewWsName('')
    } catch {
      setError('Failed to create workspace')
    } finally {
      setCreatingWs(false)
    }
  }

  async function handleShare() {
    if (!selectedWs) return
    setSaving(true)
    setError(null)
    try {
      const updated = await shareProject(projectId, selectedWs, ['read', 'write'], linkEnabled)
      setShare(updated)
      const wsMembers = await getWorkspaceMembers(selectedWs)
      setMembers(wsMembers)
    } catch {
      setError('Failed to update sharing settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !selectedWs) return
    setSaving(true)
    setError(null)
    try {
      const member = await inviteMember(selectedWs, inviteEmail.trim(), inviteRole)
      setMembers(prev => [...prev, member])
      setInviteEmail('')
    } catch {
      setError('Failed to invite member')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!selectedWs) return
    try {
      await removeMember(selectedWs, memberId)
      setMembers(prev => prev.filter(m => m._id !== memberId))
    } catch {
      setError('Failed to remove member')
    }
  }

  function handleCopyLink() {
    if (!share?.shareToken) return
    const url = `${window.location.origin}/shared/${share.shareToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function getMemberDisplayName(m: WorkspaceMember): string {
    if (typeof m.userId === 'object' && m.userId) return m.userId.name
    return m.invitedEmail ?? 'Unknown'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-cyan" />
            <span className="font-semibold text-sm text-text-primary">Share Project</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-cyan" />
            </div>
          ) : (
            <>
              {/* Workspace selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Workspace</label>
                {workspaces.length > 0 ? (
                  <select
                    value={selectedWs}
                    onChange={e => setSelectedWs(e.target.value)}
                    className="w-full bg-bg-overlay border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan/40"
                  >
                    {workspaces.map(ws => (
                      <option key={ws._id} value={ws._id}>{ws.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-text-tertiary bg-bg-overlay rounded-lg px-3 py-2">
                    No workspaces yet — create one below
                  </div>
                )}

                {/* Create workspace */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWsName}
                    onChange={e => setNewWsName(e.target.value)}
                    placeholder="New workspace name…"
                    className="flex-1 bg-bg-overlay border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40"
                    onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
                  />
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={!newWsName.trim() || creatingWs}
                    className="px-3 py-1.5 rounded-lg bg-cyan/10 text-cyan text-xs font-medium hover:bg-cyan/20 disabled:opacity-40 transition-colors"
                  >
                    {creatingWs ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
                  </button>
                </div>
              </div>

              {/* Invite member */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Invite by email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="flex-1 bg-bg-overlay border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40"
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as Exclude<MemberRole, 'owner'>)}
                    className="bg-bg-overlay border border-white/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-cyan/40"
                  >
                    {(Object.keys(ROLE_LABELS) as Exclude<MemberRole, 'owner'>[]).map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || !selectedWs || saving}
                    className="p-1.5 rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 disabled:opacity-40 transition-colors"
                    title="Send invite"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>
              </div>

              {/* Members list */}
              {members.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Shared with ({members.length})</label>
                  <div className="space-y-1">
                    {members.map(m => (
                      <div key={m._id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-overlay">
                        <div>
                          <div className="text-xs text-text-primary">{getMemberDisplayName(m)}</div>
                          {m.invitedEmail && typeof m.userId !== 'object' && (
                            <div className="text-[10px] text-text-tertiary">Invitation pending</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded font-mono',
                            m.role === 'owner'  ? 'bg-violet/20 text-violet' :
                            m.role === 'admin'  ? 'bg-warning/20 text-warning' :
                            m.role === 'editor' ? 'bg-cyan/20 text-cyan' :
                                                  'bg-white/10 text-text-tertiary'
                          )}>
                            {m.role}
                          </span>
                          {m.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(m._id)}
                              className="p-1 rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Link sharing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 size={13} className="text-text-tertiary" />
                    <span className="text-xs font-medium text-text-secondary">Link sharing</span>
                  </div>
                  <button
                    onClick={() => setLinkEnabled(v => !v)}
                    className={cn(
                      'relative w-9 h-5 rounded-full transition-colors',
                      linkEnabled ? 'bg-cyan' : 'bg-white/10'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      linkEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
                {linkEnabled && share?.shareToken && (
                  <div className="flex gap-2">
                    <div className="flex-1 bg-bg-overlay border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-tertiary font-mono truncate">
                      {`${window.location.origin}/shared/${share.shareToken}`}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="p-1.5 rounded-lg bg-bg-overlay border border-white/10 text-text-tertiary hover:text-cyan transition-colors"
                      title="Copy link"
                    >
                      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!selectedWs || saving}
            className="px-4 py-1.5 rounded-lg bg-cyan text-bg-base text-sm font-medium hover:bg-cyan/90 disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
