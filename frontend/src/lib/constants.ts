export const DB_TARGETS = [
  { value: 'postgresql', label: 'PostgreSQL', iconName: 'Database'  },
  { value: 'mysql',      label: 'MySQL',      iconName: 'Database'  },
  { value: 'sqlite',     label: 'SQLite',     iconName: 'HardDrive' },
  { value: 'mongodb',    label: 'MongoDB',    iconName: 'Layers'    },
  { value: 'firestore',  label: 'Firestore',  iconName: 'Flame'     },
]

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export const HTTP_METHOD_COLORS: Record<string, string> = {
  GET:     '#10B981',
  POST:    '#3B82F6',
  PUT:     '#F59E0B',
  PATCH:   '#8B5CF6',
  DELETE:  '#EF4444',
  HEAD:    '#6B7280',
  OPTIONS: '#6B7280',
}

export const COLUMN_TYPES_SQL = [
  'VARCHAR', 'TEXT', 'CHAR',
  'INTEGER', 'BIGINT', 'SMALLINT', 'DECIMAL', 'FLOAT', 'DOUBLE',
  'BOOLEAN',
  'TIMESTAMP', 'DATE', 'TIME',
  'UUID', 'SERIAL',
  'JSON', 'JSONB',
  'BLOB', 'BYTEA',
]

export const COLUMN_TYPES_NOSQL = ['String', 'Number', 'Boolean', 'Date', 'ObjectId', 'Array', 'Object']

export const SCHEMA_TEMPLATES = ['e-commerce', 'blog', 'inventory', 'saas', 'social-network']

export const DEMO_PROJECT_ID = 'demo-project-ecommerce'

export const NAV_TABS = [
  { id: 'schema-designer', label: 'Schema Designer', icon: 'Database' },
  { id: 'visualizer',      label: 'ER Visualizer',   icon: 'GitBranch' },
  { id: 'query-editor',    label: 'Query Editor',    icon: 'Terminal' },
  { id: 'api-checker',     label: 'API Checker',     icon: 'Zap' },
] as const

export const QUERY_HISTORY_MAX = 50

export const AI_KEYWORDS: Record<string, string[]> = {
  'e-commerce': ['shop', 'store', 'product', 'order', 'cart', 'payment', 'checkout', 'inventory', 'retail', 'ecommerce'],
  'blog':       ['blog', 'post', 'article', 'comment', 'tag', 'author', 'publish', 'content', 'cms', 'editorial'],
  'inventory':  ['inventory', 'warehouse', 'stock', 'supplier', 'purchase', 'sku', 'supply', 'logistics', 'shipment'],
  'saas':       ['saas', 'subscription', 'plan', 'org', 'team', 'billing', 'usage', 'tenant', 'workspace', 'enterprise'],
  'social-network': ['social', 'follow', 'like', 'friend', 'profile', 'feed', 'message', 'notification', 'network', 'community'],
}
