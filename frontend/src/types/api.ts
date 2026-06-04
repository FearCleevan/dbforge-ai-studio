export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface KeyValuePair {
  id:      string
  key:     string
  value:   string
  enabled: boolean
}

export interface APIRequest {
  id:                string
  name?:             string
  method:            HTTPMethod
  url:               string
  headers:           KeyValuePair[]
  params:            KeyValuePair[]
  body?:             string
  bodyType:          'json' | 'form-data' | 'raw' | 'none'
  authType:          'none' | 'bearer' | 'basic' | 'api-key'
  authValue?:        string
  testScript?:       string
  preRequestScript?: string
}

export interface APICollection {
  _id:         string
  name:        string
  description?: string
  workspaceId?: string
  requests:    APIRequest[]
  createdAt:   string
  updatedAt:   string
}

export interface CollectionRunResult {
  id:      string
  status:  number
  timeMs:  number
  error?:  string
}

export interface CollectionRunSummary {
  results: CollectionRunResult[]
  summary: { total: number; passed: number; failed: number }
}

export interface ScriptTestResult {
  name:   string
  passed: boolean
  error?: string
}

export interface DBAssertionResult {
  success: boolean
  rowCount: number
  message: string
}

export interface ExtendedAPITest extends APITest {
  source?: 'auto' | 'script'
}

export interface APIResponse {
  status:     number
  statusText: string
  headers:    Record<string, string>
  body:       unknown
  timeMs:     number
  size:       number
}

export interface APITest {
  id:        string
  name:      string
  assertion: string
  type:      'status' | 'body' | 'header' | 'schema'
  expected:  string
  result?:   'pass' | 'fail'
  error?:    string
}

export interface APIFlowStep {
  id:        string
  name:      string
  request:   APIRequest
  response?: APIResponse
  tests?:    APITest[]
}

export interface APIEnvironment {
  id:        string
  name:      string
  variables: KeyValuePair[]
}
