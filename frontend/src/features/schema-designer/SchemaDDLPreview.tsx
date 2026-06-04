import { useState } from 'react'
import { Download, ChevronDown, ChevronRight } from 'lucide-react'
import { SchemaDefinition } from '@/types'
import { generateDDL, generateMongoSchema } from '@/lib/utils/schemaHelpers'
import { CopyButton } from '@/components/shared/CopyButton'
import { cn } from '@/lib/utils/cn'

interface Props {
  schema: SchemaDefinition | null
}

type PreviewTab = 'DDL' | 'NoSQL' | 'JSON'

const SYNTAX_KEYWORDS = ['CREATE', 'TABLE', 'PRIMARY', 'KEY', 'NOT', 'NULL', 'UNIQUE', 'DEFAULT', 'FOREIGN', 'REFERENCES', 'INDEX', 'CONSTRAINT']
const SYNTAX_TYPES = ['UUID', 'VARCHAR', 'TEXT', 'INTEGER', 'BIGINT', 'DECIMAL', 'FLOAT', 'BOOLEAN', 'TIMESTAMP', 'DATE', 'TIME', 'SERIAL', 'JSON', 'JSONB', 'BLOB', 'BYTEA']

function highlightSQL(code: string): React.ReactNode {
  const lines = code.split('\n')
  return lines.map((line, i) => {
    const isComment = line.trim().startsWith('--')
    const isCREATE = line.trim().startsWith('CREATE')
    const parts = line.split(/(\b\w+\b|[();,])/g)

    return (
      <div key={i}>
        {isComment ? (
          <span style={{ color: '#5C6370' }}>{line}</span>
        ) : (
          parts.map((part, j) => {
            if (SYNTAX_KEYWORDS.includes(part.toUpperCase()))
              return <span key={j} style={{ color: '#C678DD' }}>{part}</span>
            if (SYNTAX_TYPES.includes(part.toUpperCase()))
              return <span key={j} style={{ color: '#61AFEF' }}>{part}</span>
            if (isCREATE && j === 0)
              return <span key={j} style={{ color: '#C678DD' }}>{part}</span>
            if (/^'.*'$/.test(part))
              return <span key={j} style={{ color: '#98C379' }}>{part}</span>
            if (/^\d+$/.test(part))
              return <span key={j} style={{ color: '#D19A66' }}>{part}</span>
            return <span key={j} className="text-text-code">{part}</span>
          })
        )}
      </div>
    )
  })
}

export function SchemaDDLPreview({ schema }: Props) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('DDL')
  const [explanationOpen, setExplanationOpen] = useState(true)

  if (!schema) {
    return (
      <div className="w-[320px] flex-shrink-0 surface border-l border-white/5 flex items-center justify-center">
        <p className="text-text-tertiary text-sm text-center px-4">Generate a schema to see the DDL preview</p>
      </div>
    )
  }

  const ddl = generateDDL(schema)
  const nosql = JSON.stringify(generateMongoSchema(schema), null, 2)
  const json = JSON.stringify(schema, null, 2)

  const activeContent = activeTab === 'DDL' ? ddl : activeTab === 'NoSQL' ? nosql : json
  const ext = activeTab === 'DDL' ? 'sql' : 'json'

  const handleDownload = () => {
    const blob = new Blob([activeContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schema.name.replace(/\s+/g, '-').toLowerCase()}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-[320px] flex-shrink-0 surface border-l border-white/5 flex flex-col overflow-hidden">
      {/* Tab bar + actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 flex-shrink-0">
        <div className="flex gap-1">
          {(['DDL', 'NoSQL', 'JSON'] as PreviewTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-mono transition-colors',
                activeTab === tab
                  ? 'bg-cyan/10 text-cyan'
                  : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <CopyButton text={activeContent} />
          <button
            onClick={handleDownload}
            title={`Download .${ext}`}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 font-mono leading-relaxed text-text-code" style={{ fontSize: '12px' }}>
          {activeTab === 'DDL' ? highlightSQL(ddl) : activeContent}
        </pre>
      </div>

      {/* Explanation */}
      {schema.explanation && (
        <div className="border-t border-white/5 flex-shrink-0">
          <button
            onClick={() => setExplanationOpen(v => !v)}
            className="flex items-center gap-1.5 w-full px-3 py-2.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {explanationOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            AI Explanation
          </button>
          {explanationOpen && (
            <div className="px-4 pb-4">
              <p className="text-text-secondary text-xs leading-relaxed italic">{schema.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
