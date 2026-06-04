import { useState, useEffect, useRef, useCallback } from 'react'
import { X, MessageCircle, Send, Check, Loader2, Reply, Trash2 } from 'lucide-react'
import { Comment } from '@/types/collaboration'
import { listComments, createComment, addReply, toggleResolve, deleteComment } from '@/lib/api/comments'
import { cn } from '@/lib/utils/cn'

interface Props {
  projectId: string
  tableId: string
  tableName: string
  onClose: () => void
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return new Date(iso).toLocaleDateString()
}

export function CommentThread({ projectId, tableId, tableName, onClose }: Props) {
  const [comments, setComments]       = useState<Comment[]>([])
  const [loading, setLoading]         = useState(true)
  const [body, setBody]               = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [replyTo, setReplyTo]         = useState<string | null>(null)
  const [replyBody, setReplyBody]     = useState('')
  const [error, setError]             = useState<string | null>(null)
  const bottomRef                     = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listComments(projectId, 'table', tableId)
      setComments(list)
    } catch {
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [projectId, tableId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handleSubmit() {
    if (!body.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const comment = await createComment(projectId, 'table', tableId, body.trim())
      setComments(prev => [comment, ...prev])
      setBody('')
    } catch {
      setError('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReply(commentId: string) {
    if (!replyBody.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const updated = await addReply(commentId, replyBody.trim())
      setComments(prev => prev.map(c => c._id === commentId ? updated : c))
      setReplyBody('')
      setReplyTo(null)
    } catch {
      setError('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleResolve(commentId: string) {
    try {
      const updated = await toggleResolve(commentId)
      setComments(prev => prev.map(c => c._id === commentId ? updated : c))
    } catch {
      setError('Failed to update comment')
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId)
      setComments(prev => prev.filter(c => c._id !== commentId))
    } catch {
      setError('Failed to delete comment')
    }
  }

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div
        className="absolute top-4 right-4 w-80 max-h-[85%] flex flex-col bg-bg-surface border border-white/10 rounded-2xl shadow-2xl pointer-events-auto animate-fade-in"
        style={{ maxHeight: 'calc(100% - 32px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle size={14} className="text-cyan flex-shrink-0" />
            <span className="font-semibold text-xs text-text-primary truncate">{tableName}</span>
            {comments.length > 0 && (
              <span className="text-[10px] bg-cyan/20 text-cyan px-1.5 py-0.5 rounded-full font-mono flex-shrink-0">
                {comments.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors flex-shrink-0">
            <X size={13} />
          </button>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {error && (
            <div className="text-[10px] text-error bg-error/10 border border-error/20 rounded px-2 py-1.5">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-cyan" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6">
              <MessageCircle size={24} className="mx-auto mb-2 text-text-tertiary opacity-30" />
              <p className="text-xs text-text-tertiary">No comments yet</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment._id} className={cn(
                'rounded-xl border p-3 space-y-2',
                comment.resolved
                  ? 'border-white/5 bg-white/[0.02] opacity-60'
                  : 'border-white/10 bg-bg-overlay'
              )}>
                {/* Comment header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-text-tertiary">{formatRelative(comment.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    {comment.resolved && (
                      <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded font-mono">resolved</span>
                    )}
                    <button
                      onClick={() => handleToggleResolve(comment._id)}
                      title={comment.resolved ? 'Reopen' : 'Resolve'}
                      className="p-1 rounded text-text-tertiary hover:text-success hover:bg-success/10 transition-colors"
                    >
                      <Check size={11} />
                    </button>
                    <button
                      onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                      title="Reply"
                      className="p-1 rounded text-text-tertiary hover:text-cyan hover:bg-cyan/10 transition-colors"
                    >
                      <Reply size={11} />
                    </button>
                    <button
                      onClick={() => handleDelete(comment._id)}
                      title="Delete"
                      className="p-1 rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Comment body */}
                <p className="text-xs text-text-primary leading-relaxed">{comment.body}</p>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="space-y-1.5 pl-3 border-l border-white/10">
                    {comment.replies.map(reply => (
                      <div key={reply._id} className="text-xs">
                        <span className="text-[10px] text-text-tertiary mr-1.5">{formatRelative(reply.createdAt)}</span>
                        <span className="text-text-secondary">{reply.body}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {replyTo === comment._id && (
                  <div className="flex gap-1.5 mt-1">
                    <input
                      type="text"
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      placeholder="Write a reply…"
                      autoFocus
                      className="flex-1 bg-bg-base border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40"
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply(comment._id)}
                    />
                    <button
                      onClick={() => handleReply(comment._id)}
                      disabled={!replyBody.trim() || submitting}
                      className="p-1.5 rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 disabled:opacity-40 transition-colors"
                    >
                      {submitting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* New comment input */}
        <div className="flex-shrink-0 border-t border-white/5 p-3">
          <div className="flex gap-2">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Add a comment…"
              rows={2}
              className="flex-1 bg-bg-overlay border border-white/10 rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40 resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
              className="p-2 rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 disabled:opacity-40 transition-colors self-end"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
          <p className="text-[10px] text-text-tertiary mt-1">Enter to submit · Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  )
}
