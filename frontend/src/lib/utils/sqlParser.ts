import { QueryType } from '@/types'

export const getQueryType = (sql: string): QueryType => {
  const trimmed = sql.trim().toUpperCase()
  if (trimmed.startsWith('SELECT')) return 'SELECT'
  if (trimmed.startsWith('INSERT')) return 'INSERT'
  if (trimmed.startsWith('UPDATE')) return 'UPDATE'
  if (trimmed.startsWith('DELETE')) return 'DELETE'
  if (trimmed.startsWith('CREATE')) return 'CREATE'
  if (trimmed.startsWith('DROP'))   return 'DROP'
  if (trimmed.startsWith('ALTER'))  return 'ALTER'
  return 'SELECT'
}

export const extractTableName = (sql: string): string | null => {
  const fromMatch = sql.match(/FROM\s+["']?(\w+)["']?/i)
  if (fromMatch) return fromMatch[1].toLowerCase()

  const intoMatch = sql.match(/INTO\s+["']?(\w+)["']?/i)
  if (intoMatch) return intoMatch[1].toLowerCase()

  const updateMatch = sql.match(/UPDATE\s+["']?(\w+)["']?/i)
  if (updateMatch) return updateMatch[1].toLowerCase()

  const fromDeleteMatch = sql.match(/DELETE\s+FROM\s+["']?(\w+)["']?/i)
  if (fromDeleteMatch) return fromDeleteMatch[1].toLowerCase()

  return null
}

export const isValidSQL = (sql: string): boolean => {
  if (!sql.trim()) return false
  const keywords = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|EXPLAIN)\s/i
  return keywords.test(sql)
}

export const formatSQL = (sql: string): string => {
  return sql
    .replace(/\bSELECT\b/gi, 'SELECT')
    .replace(/\bFROM\b/gi, '\nFROM')
    .replace(/\bWHERE\b/gi, '\nWHERE')
    .replace(/\bAND\b/gi, '\n  AND')
    .replace(/\bOR\b/gi, '\n  OR')
    .replace(/\bJOIN\b/gi, '\nJOIN')
    .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
    .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
    .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
    .replace(/\bORDER BY\b/gi, '\nORDER BY')
    .replace(/\bLIMIT\b/gi, '\nLIMIT')
    .replace(/\bOFFSET\b/gi, '\nOFFSET')
    .trim()
}
