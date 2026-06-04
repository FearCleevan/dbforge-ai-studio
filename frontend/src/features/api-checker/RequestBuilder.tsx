import { useState } from 'react'
import { Send, ChevronDown, Lock, Key } from 'lucide-react'
import { APIRequest, HTTPMethod } from '@/types'
import { HTTP_METHODS, HTTP_METHOD_COLORS } from '@/lib/constants'
import { KeyValueEditor } from './KeyValueEditor'
import { cn } from '@/lib/utils/cn'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

type BuilderTab = 'params' | 'headers' | 'body' | 'auth' | 'tests' | 'pre-request'

interface Props {
  request: APIRequest
  onChange: (req: APIRequest) => void
  onSend: () => void
  isRunning: boolean
}

function MethodSelector({ value, onChange }: { value: HTTPMethod; onChange: (m: HTTPMethod) => void }) {
  const [open, setOpen] = useState(false)
  const color = HTTP_METHOD_COLORS[value] ?? '#6B7280'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-3 py-2 rounded-l-lg border border-white/10 border-r-0 bg-bg-elevated hover:bg-white/5 transition-colors text-xs font-mono font-bold"
        style={{ color }}
      >
        {value}
        <ChevronDown size={11} className="text-text-tertiary" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-bg-elevated border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[110px]">
            {HTTP_METHODS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { onChange(m as HTTPMethod); setOpen(false) }}
                className="w-full flex items-center px-3 py-1.5 text-xs font-mono font-bold hover:bg-white/5 transition-colors"
                style={{ color: HTTP_METHOD_COLORS[m] ?? '#6B7280' }}
              >
                {m}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const TABS: { id: BuilderTab; label: string }[] = [
  { id: 'params',       label: 'Params' },
  { id: 'headers',      label: 'Headers' },
  { id: 'body',         label: 'Body' },
  { id: 'auth',         label: 'Auth' },
  { id: 'pre-request',  label: 'Pre-req' },
  { id: 'tests',        label: 'Tests' },
]

const BODY_TYPES = [
  { value: 'json', label: 'JSON' },
  { value: 'form-data', label: 'Form-Data' },
  { value: 'raw', label: 'Raw' },
  { value: 'none', label: 'None' },
] as const

export function RequestBuilder({ request, onChange, onSend, isRunning }: Props) {
  const [activeTab, setActiveTab] = useState<BuilderTab>('params')

  const update = <K extends keyof APIRequest>(key: K, value: APIRequest[K]) =>
    onChange({ ...request, [key]: value })

  const methodColor = HTTP_METHOD_COLORS[request.method] ?? '#6B7280'
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS'

  return (
    <div className="flex flex-col border-b border-white/5 flex-shrink-0">
      {/* URL Bar */}
      <div className="flex items-center gap-0 px-4 py-3 border-b border-white/5">
        <MethodSelector
          value={request.method}
          onChange={m => update('method', m)}
        />
        <input
          value={request.url}
          onChange={e => update('url', e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSend() }}
          placeholder="https://api.example.com/users"
          className="flex-1 bg-bg-elevated border border-white/10 px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/50 transition-colors"
          style={{ fontSize: '13px' }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={isRunning || !request.url.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-r-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: isRunning ? 'transparent' : methodColor + '22',
            color: methodColor,
            border: `1px solid ${methodColor}44`,
            borderLeft: 'none',
          }}
        >
          {isRunning ? <LoadingSpinner size="sm" color="white" /> : <Send size={13} />}
          <span>{isRunning ? 'Sending...' : 'Send'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-4 border-b border-white/5 bg-bg-elevated">
        {TABS.map(tab => {
          if (tab.id === 'body' && !hasBody) return null
          const count =
            tab.id === 'params' ? request.params.filter(p => p.enabled && p.key).length :
            tab.id === 'headers' ? request.headers.filter(h => h.enabled && h.key).length : 0
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-2 text-xs font-mono transition-colors relative flex items-center gap-1.5',
                activeTab === tab.id
                  ? 'text-cyan border-b-2 border-cyan -mb-px'
                  : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className="text-[9px] bg-cyan/20 text-cyan px-1 rounded-full">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="px-4 py-3" style={{ minHeight: '120px', maxHeight: '200px', overflowY: 'auto' }}>
        {activeTab === 'params' && (
          <KeyValueEditor
            pairs={request.params}
            onChange={pairs => update('params', pairs)}
            keyPlaceholder="param"
            valuePlaceholder="value"
          />
        )}
        {activeTab === 'headers' && (
          <KeyValueEditor
            pairs={request.headers}
            onChange={pairs => update('headers', pairs)}
            keyPlaceholder="Header-Name"
            valuePlaceholder="value"
          />
        )}
        {activeTab === 'body' && hasBody && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1">
              {BODY_TYPES.map(bt => (
                <button
                  key={bt.value}
                  type="button"
                  onClick={() => update('bodyType', bt.value)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-mono border transition-all',
                    request.bodyType === bt.value
                      ? 'border-cyan/50 bg-cyan/10 text-cyan'
                      : 'border-white/10 text-text-secondary hover:border-white/20'
                  )}
                >
                  {bt.label}
                </button>
              ))}
            </div>
            {request.bodyType !== 'none' && (
              <textarea
                value={request.body ?? ''}
                onChange={e => update('body', e.target.value)}
                placeholder={request.bodyType === 'json'
                  ? '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
                  : 'Request body...'}
                className="w-full bg-bg-muted border border-white/5 rounded px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40 resize-none transition-colors"
                rows={4}
              />
            )}
          </div>
        )}
        {activeTab === 'auth' && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-1.5">
              {(['none', 'bearer', 'basic', 'api-key'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update('authType', t)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border transition-all',
                    request.authType === t
                      ? 'border-violet/50 bg-violet/10 text-violet'
                      : 'border-white/10 text-text-secondary hover:border-white/20'
                  )}
                >
                  {t === 'bearer' && <Key size={10} />}
                  {t === 'basic' && <Lock size={10} />}
                  {t === 'api-key' && <Key size={10} />}
                  {t}
                </button>
              ))}
            </div>
            {request.authType === 'bearer' && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-text-tertiary">Bearer Token</span>
                <input
                  value={request.authValue ?? ''}
                  onChange={e => update('authValue', e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-bg-muted border border-white/5 rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-violet/40 transition-colors"
                />
              </div>
            )}
            {request.authType === 'basic' && (
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-text-tertiary">Username</span>
                  <input
                    placeholder="username"
                    className="w-full bg-bg-muted border border-white/5 rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-violet/40 transition-colors"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-text-tertiary">Password</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-bg-muted border border-white/5 rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-violet/40 transition-colors"
                  />
                </div>
              </div>
            )}
            {request.authType === 'api-key' && (
              <div className="flex gap-2">
                <input
                  placeholder="Header name (e.g. X-API-Key)"
                  className="flex-1 bg-bg-muted border border-white/5 rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-violet/40 transition-colors"
                />
                <input
                  value={request.authValue ?? ''}
                  onChange={e => update('authValue', e.target.value)}
                  placeholder="API key value"
                  className="flex-1 bg-bg-muted border border-white/5 rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-violet/40 transition-colors"
                />
              </div>
            )}
            {request.authType === 'none' && (
              <p className="text-xs text-text-tertiary font-mono">No authentication. Use Bearer, Basic, or API Key for protected endpoints.</p>
            )}
          </div>
        )}

        {activeTab === 'pre-request' && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] text-text-tertiary font-mono">
              Runs before the request. Use <span className="text-cyan">pm.request</span>, <span className="text-cyan">pm.variables</span>, <span className="text-cyan">console.log</span>.
            </p>
            <textarea
              value={request.preRequestScript ?? ''}
              onChange={e => update('preRequestScript', e.target.value)}
              placeholder={`// Example: set an auth header dynamically\npm.request.headers.add({ key: 'X-Timestamp', value: String(Date.now()) })\nconsole.log('Pre-request script ran')`}
              className="w-full bg-bg-muted border border-white/5 rounded px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40 resize-none transition-colors"
              rows={5}
              spellCheck={false}
            />
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] text-text-tertiary font-mono">
              Runs after the response. Use <span className="text-cyan">pm.test()</span>, <span className="text-cyan">pm.expect()</span>, <span className="text-cyan">pm.response</span>.
            </p>
            <textarea
              value={request.testScript ?? ''}
              onChange={e => update('testScript', e.target.value)}
              placeholder={`// Example tests\npm.test('Status is 200', function() {\n  pm.expect(pm.response.status).to.equal(200)\n})\npm.test('Response has id', function() {\n  pm.expect(pm.response.json()).to.have.property('id')\n})`}
              className="w-full bg-bg-muted border border-white/5 rounded px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40 resize-none transition-colors"
              rows={5}
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}
