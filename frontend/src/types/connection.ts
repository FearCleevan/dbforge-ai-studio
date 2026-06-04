export type DbDriver = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'

export interface DbConnection {
  _id:       string
  name:      string
  driver:    DbDriver
  host?:     string
  port?:     number
  database:  string
  username?: string
  ssl:       boolean
  filePath?: string
  status:    'connected' | 'error' | 'unknown'
  createdAt: string
  updatedAt: string
}

export interface ConnectionConfig {
  name:      string
  driver:    DbDriver
  host?:     string
  port?:     number
  database:  string
  username?: string
  password?: string
  ssl:       boolean
  filePath?: string
}

export interface TestResult {
  success: boolean
  message: string
}
