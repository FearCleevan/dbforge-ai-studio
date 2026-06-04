import { useState } from 'react'
import { CheckCircle, XCircle, Clock, HardDrive, Database, Terminal } from 'lucide-react'
import { APIResponse, APITest, DBAssertionResult } from '@/types'
import { cn } from '@/lib/utils/cn'

type ResponseTab = 'body' | 'headers' | 'tests' | 'console'

interface Props {
  response: APIResponse | null
  tests: APITest[]
  isRunning: boolean
  consoleLogs?: string[]
  dbAssertion?: DBAssertionResult | null
}

function statusColor(status: number): string {
  if (status >= 500) return 'text-error border-error/30 bg-error/5'
  if (status >= 400) return 'text-warning border-warning/30 bg-warning/5'
  if (status >= 300) return 'text-cyan border-cyan/30 bg-cyan/5'
  return 'text-emerald border-emerald/30 bg-emerald/5'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function JsonViewer({ data }: { data: unknown }) {
  const text = JSON.stringify(data, null, 2)
  return (
    <pre className="font-mono text-xs text-text-code leading-relaxed whitespace-pre-wrap break-all">
      {text}
    </pre>
  )
}

export function ResponseViewer({ response, tests, isRunning, consoleLogs = [], dbAssertion }: Props) {
  const [activeTab, setActiveTab] = useState<ResponseTab>('body')

  const passCount = tests.filter(t => t.result === 'pass').length
  const failCount = tests.filter(t => t.result === 'fail').length

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 bg-bg-elevated flex-shrink-0">
        {response ? (
          <>
            <span className={cn('text-xs font-mono font-bold px-2 py-0.5 rounded border', statusColor(response.status))}>
              {response.status} {response.statusText}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-text-tertiary">
              <Clock size={10} />
              {response.timeMs}ms
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-text-tertiary">
              <HardDrive size={10} />
              {formatBytes(response.size)}
            </span>
          </>
        ) : (
          <span className="text-xs font-mono text-text-tertiary">
            {isRunning ? 'Awaiting response...' : 'Send a request to see the response'}
          </span>
        )}

        {/* Tabs pushed to right */}
        <div className="ml-auto flex items-center gap-0">
          {(['body', 'headers', 'tests', 'console'] as ResponseTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 text-xs font-mono transition-colors flex items-center gap-1.5 capitalize',
                activeTab === tab ? 'text-cyan border-b-2 border-cyan' : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              {tab === 'console' && consoleLogs.length > 0 && (
                <span className="text-[9px] bg-cyan/20 text-cyan px-1 rounded-full">{consoleLogs.length}</span>
              )}
              {tab === 'tests' && tests.length > 0 && (
                <span className={cn(
                  'text-[9px] px-1 rounded-full font-bold',
                  failCount > 0 ? 'bg-error/20 text-error' : 'bg-emerald/20 text-emerald'
                )}>
                  {failCount > 0 ? `${failCount} fail` : `${passCount} pass`}
                </span>
              )}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isRunning && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs text-text-tertiary font-mono">Sending request...</span>
            </div>
          </div>
        )}

        {!isRunning && !response && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-tertiary">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-text-secondary mb-1">No response yet</div>
              <div className="text-xs font-mono">Configure your request and click Send</div>
            </div>
          </div>
        )}

        {!isRunning && response && activeTab === 'body' && (
          response.body !== null && response.body !== undefined ? (
            <JsonViewer data={response.body} />
          ) : (
            <span className="text-xs font-mono text-text-tertiary italic">Empty response body</span>
          )
        )}

        {!isRunning && response && activeTab === 'headers' && (
          <div className="space-y-1">
            {Object.entries(response.headers).map(([key, val]) => (
              <div key={key} className="flex items-start gap-3 text-xs font-mono py-1 border-b border-white/[0.04]">
                <span className="text-cyan flex-shrink-0 w-[200px] truncate">{key}</span>
                <span className="text-text-secondary break-all">{val}</span>
              </div>
            ))}
          </div>
        )}

        {!isRunning && activeTab === 'tests' && (
          <div className="space-y-3">
            {/* DB assertion */}
            {dbAssertion && (
              <div className={cn(
                'flex items-center gap-2 p-3 rounded-lg border text-sm font-mono',
                dbAssertion.success ? 'border-success/20 bg-success/5 text-success' : 'border-error/20 bg-error/5 text-error'
              )}>
                <Database size={14} className="flex-shrink-0" />
                {dbAssertion.message}
              </div>
            )}

            {tests.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-xs font-mono text-text-tertiary">
                Run a request to see test results
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-mono text-emerald">
                    <CheckCircle size={12} /> {passCount} passed
                  </span>
                  {failCount > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-error">
                      <XCircle size={12} /> {failCount} failed
                    </span>
                  )}
                </div>
                {tests.map(test => (
                  <div
                    key={test.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border',
                      test.result === 'pass'
                        ? 'border-emerald/20 bg-emerald/5'
                        : 'border-error/20 bg-error/5'
                    )}
                  >
                    {test.result === 'pass'
                      ? <CheckCircle size={13} className="text-emerald flex-shrink-0 mt-0.5" />
                      : <XCircle size={13} className="text-error flex-shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-text-primary">{test.name}</div>
                      <div className="text-[10px] font-mono text-text-tertiary mt-0.5">{test.assertion}</div>
                      {test.error && (
                        <div className="text-[10px] font-mono text-error mt-1">{test.error}</div>
                      )}
                    </div>
                    <span className={cn(
                      'text-[10px] font-mono font-bold flex-shrink-0',
                      test.result === 'pass' ? 'text-emerald' : 'text-error'
                    )}>
                      {test.result?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isRunning && activeTab === 'console' && (
          consoleLogs.length === 0 ? (
            <div className="flex items-center gap-2 justify-center h-24 text-xs font-mono text-text-tertiary">
              <Terminal size={14} /> No console output
            </div>
          ) : (
            <div className="space-y-0.5">
              {consoleLogs.map((log, i) => (
                <div key={i} className={cn(
                  'font-mono text-xs px-2 py-1 rounded',
                  log.startsWith('[error]') ? 'text-error bg-error/5' :
                  log.startsWith('[warn]')  ? 'text-warning bg-warning/5' :
                                              'text-text-secondary bg-white/[0.02]'
                )}>
                  {log}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
