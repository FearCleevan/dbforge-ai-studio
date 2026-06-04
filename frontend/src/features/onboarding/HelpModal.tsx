import { X, HelpCircle } from 'lucide-react'

interface Feature {
  title:       string
  description: string
  steps:       string[]
  tip:         string
}

const FEATURE_HELP: Record<string, Feature> = {
  'schema-designer': {
    title:       'Schema Designer',
    description: 'Generate complete database schemas from natural language descriptions using AI.',
    steps: [
      'Describe your data model in the prompt box (e.g. "Blog with posts, comments, and tags")',
      'Select a target database (PostgreSQL, MySQL, SQLite, MongoDB, Firestore)',
      'Click Generate — AI produces tables, columns, types, and relationships',
      'Refine by editing the schema directly or submitting follow-up prompts',
      'Export as DDL SQL or switch to ER Visualizer to explore visually',
    ],
    tip: 'Include domain context for better results: "SaaS product with multi-tenant support, subscription plans, and usage metering"',
  },
  'visualizer': {
    title:       'ER Visualizer',
    description: 'Interactive entity-relationship diagram of your current schema.',
    steps: [
      'Navigate here after generating a schema in Schema Designer',
      'Drag table nodes to rearrange the layout',
      'Click "Auto Layout" to apply Dagre graph layout automatically',
      'Click any node to open its detail panel with column info',
      'Use the search bar to highlight tables by name',
      'Toggle "Compact" mode to show only PK/FK columns',
    ],
    tip: 'Export the ER diagram as an SVG using the Export button in the toolbar.',
  },
  'query-editor': {
    title:       'Query Editor',
    description: 'Write, execute, and optimize SQL queries with Monaco editor and AI assistance.',
    steps: [
      'Connect a database via the Connections panel, or run in demo mode',
      'Select a connection from the toolbar dropdown',
      'Type SQL or press "Generate" to describe a query in plain English',
      'Press Ctrl+Enter to execute against the connected database',
      'Use "Optimize" to improve slow queries, "Translate" to switch dialects',
      'Query history is saved automatically',
    ],
    tip: 'Prefix your natural language query with your schema context for more accurate AI generation.',
  },
  'api-checker': {
    title:       'API Checker',
    description: 'Full-featured REST API testing with test scripts, collections, and DB assertions.',
    steps: [
      'Enter a URL and select an HTTP method, then press Send',
      'Add headers, query params, and a request body using the tabs',
      'Write test scripts in the Tests tab using pm.test() and pm.expect()',
      'Pre-request scripts run before the request — use them to set headers dynamically',
      'Save requests to Collections and run them all at once with the Collection Runner',
      'DB assertions automatically verify database state after POST/PUT/DELETE',
    ],
    tip: 'Use {{variableName}} syntax in URLs and headers to reference environment variables.',
  },
  'connections': {
    title:       'Connections',
    description: 'Connect to real databases for live query execution and schema import.',
    steps: [
      'Click "+ New Connection" and fill in the connection details',
      'Test the connection before saving to verify credentials',
      'Use "Import Schema" to reverse-engineer the database schema',
      'Select a saved connection in the Query Editor toolbar to run live queries',
      'Connections are encrypted and stored securely',
    ],
    tip: 'SQLite connections use a file path — perfect for local development without a server.',
  },
}

interface Props {
  tool:    string
  onClose: () => void
}

export function HelpModal({ tool, onClose }: Props) {
  const help = FEATURE_HELP[tool]
  if (!help) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <HelpCircle size={15} className="text-cyan" />
            <span className="font-semibold text-sm text-text-primary">{help.title}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">{help.description}</p>

          <div>
            <h3 className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider mb-2">How to use</h3>
            <ol className="space-y-2">
              {help.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-text-secondary leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan/10 text-cyan text-[10px] font-mono flex items-center justify-center">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-cyan/5 border border-cyan/10 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5">💡</span>
              <p className="text-xs text-text-secondary leading-relaxed">{help.tip}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
