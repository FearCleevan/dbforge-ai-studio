export interface QueryDefinition {
  id:        string
  name?:     string
  sql:       string
  createdAt: string
}

export interface QueryResult {
  columns:      string[]
  rows:         Record<string, unknown>[]
  rowCount:     number
  executionMs:  number
  error?:       string
}

export interface ExplainPlan {
  steps:         ExplainStep[]
  totalCost:     number
  estimatedRows: number
}

export interface ExplainStep {
  operation: string
  table?:    string
  index?:    string
  cost:      number
  rows:      number
  detail:    string
}

export type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER'
