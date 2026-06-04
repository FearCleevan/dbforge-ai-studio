import { APIRequest, APIResponse, APITest, KeyValuePair } from '@/types'
import {
  mockListResponse, mockSingleResponse, mockCreatedResponse,
  mockUpdatedResponse, mockDeletedResponse, mockErrorResponses,
  mockUsersListResponse, mockUserSingleResponse, mockUserCreatedResponse,
} from '@/lib/mock/apiResponses'
import { mockQueryResults } from '@/lib/mock/queries'

const DELAY = () => Math.random() * 400 + 100

function resolveVariables(text: string, vars: KeyValuePair[]): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const found = vars.find(v => v.enabled && v.key === key)
    return found ? found.value : `{{${key}}}`
  })
}

function extractResource(url: string): { resource: string; id: string | null } {
  try {
    const path = new URL(url).pathname
    const segments = path.split('/').filter(Boolean)
    const apiIdx = segments.indexOf('api')
    const start = apiIdx !== -1 ? apiIdx + 1 : 0
    const resource = segments[start] ?? 'resource'
    const rawId = segments[start + 1] ?? null
    const id = rawId?.match(/^\d+$|^[0-9a-f-]{36}$/) ? rawId : null
    return { resource, id }
  } catch {
    const parts = url.split('/').filter(s => s && !s.includes('://'))
    const last = parts[parts.length - 1] ?? 'resource'
    const secondLast = parts[parts.length - 2] ?? 'resource'
    const isId = /^\d+$|^[0-9a-f-]{36}$/.test(last)
    return { resource: isId ? secondLast : last, id: isId ? last : null }
  }
}

function generateRows(resource: string): unknown[] {
  const stored = mockQueryResults[resource.toLowerCase()]
  if (stored) return stored.rows.slice(0, 3)
  return Array.from({ length: 3 }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `${resource.replace(/s$/, '')} ${i + 1}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
  }))
}

export async function simulateAPIRequest(
  request: APIRequest,
  envVars: KeyValuePair[]
): Promise<APIResponse> {
  await new Promise(r => setTimeout(r, DELAY()))

  const url = resolveVariables(request.url.trim(), envVars)
  if (!url) return mockErrorResponses[400]

  const isProtected = url.includes('/admin') || url.includes('/private') || url.includes('/internal')
  if (isProtected && request.authType === 'none') return { ...mockErrorResponses[401] }

  const { resource, id } = extractResource(url)
  const method = request.method

  if (resource === 'users' || resource === 'user') {
    if (method === 'GET' && !id) return { ...mockUsersListResponse, timeMs: Math.floor(Math.random() * 150 + 50) }
    if (method === 'GET' && id) return { ...mockUserSingleResponse, timeMs: Math.floor(Math.random() * 80 + 20) }
    if (method === 'POST') return { ...mockUserCreatedResponse, timeMs: Math.floor(Math.random() * 180 + 80) }
  }

  const rows = generateRows(resource)

  if (method === 'GET' && !id) return mockListResponse(resource, rows)
  if (method === 'GET' && id) return mockSingleResponse(rows[0])
  if (method === 'POST') return mockCreatedResponse({ id: crypto.randomUUID(), ...(rows[0] as Record<string, unknown>) })
  if (method === 'PUT' || method === 'PATCH') return mockUpdatedResponse({ id: id ?? crypto.randomUUID(), ...(rows[0] as Record<string, unknown>) })
  if (method === 'DELETE') return mockDeletedResponse()
  if (method === 'HEAD') return { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' }, body: null, timeMs: 12, size: 0 }
  if (method === 'OPTIONS') return { status: 204, statusText: 'No Content', headers: { Allow: 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS', 'Access-Control-Allow-Origin': '*' }, body: null, timeMs: 8, size: 0 }

  return { ...mockErrorResponses[404] }
}

export function runAutoTests(request: APIRequest, response: APIResponse): APITest[] {
  const tests: APITest[] = []
  const expectOk = ['GET', 'PUT', 'PATCH'].includes(request.method)
  const expectCreated = request.method === 'POST'
  const expectedStatus = expectCreated ? 201 : expectOk ? 200 : 200

  tests.push({
    id: crypto.randomUUID(),
    name: `Status is ${expectedStatus}`,
    assertion: `response.status === ${expectedStatus}`,
    type: 'status',
    expected: String(expectedStatus),
    result: response.status === expectedStatus ? 'pass' : 'fail',
  })

  tests.push({
    id: crypto.randomUUID(),
    name: 'Response time < 500ms',
    assertion: 'response.timeMs < 500',
    type: 'body',
    expected: '< 500',
    result: response.timeMs < 500 ? 'pass' : 'fail',
  })

  const ct = response.headers['Content-Type'] ?? response.headers['content-type'] ?? ''
  tests.push({
    id: crypto.randomUUID(),
    name: 'Content-Type is JSON',
    assertion: "response.headers['Content-Type'].includes('application/json')",
    type: 'header',
    expected: 'application/json',
    result: ct.includes('application/json') ? 'pass' : 'fail',
  })

  if (response.body !== null && response.body !== undefined) {
    tests.push({
      id: crypto.randomUUID(),
      name: 'Response body is not empty',
      assertion: 'response.body !== null',
      type: 'body',
      expected: 'not null',
      result: 'pass',
    })
  }

  if (request.method === 'GET' && typeof response.body === 'object' && response.body !== null) {
    const body = response.body as Record<string, unknown>
    if ('data' in body && Array.isArray(body.data)) {
      tests.push({
        id: crypto.randomUUID(),
        name: 'Response has data array',
        assertion: 'Array.isArray(response.body.data)',
        type: 'body',
        expected: 'array',
        result: 'pass',
      })
    }
  }

  return tests
}
