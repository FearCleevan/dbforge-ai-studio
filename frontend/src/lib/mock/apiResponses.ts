import { APIResponse } from '@/types'

const makeHeaders = (contentType = 'application/json'): Record<string, string> => ({
  'Content-Type': contentType,
  'X-Request-Id': crypto.randomUUID(),
  'Cache-Control': 'no-cache',
  'Access-Control-Allow-Origin': '*',
})

export const mockListResponse = (_tableName: string, rows: unknown[]): APIResponse => ({
  status: 200,
  statusText: 'OK',
  headers: makeHeaders(),
  body: { data: rows, total: rows.length, page: 1, limit: 10 },
  timeMs: Math.floor(Math.random() * 200) + 50,
  size: JSON.stringify(rows).length,
})

export const mockSingleResponse = (item: unknown): APIResponse => ({
  status: 200,
  statusText: 'OK',
  headers: makeHeaders(),
  body: item,
  timeMs: Math.floor(Math.random() * 100) + 20,
  size: JSON.stringify(item).length,
})

export const mockCreatedResponse = (item: unknown): APIResponse => ({
  status: 201,
  statusText: 'Created',
  headers: { ...makeHeaders(), Location: `/api/resource/${(item as Record<string, unknown>).id}` },
  body: item,
  timeMs: Math.floor(Math.random() * 150) + 80,
  size: JSON.stringify(item).length,
})

export const mockUpdatedResponse = (item: unknown): APIResponse => ({
  status: 200,
  statusText: 'OK',
  headers: makeHeaders(),
  body: item,
  timeMs: Math.floor(Math.random() * 120) + 60,
  size: JSON.stringify(item).length,
})

export const mockDeletedResponse = (): APIResponse => ({
  status: 200,
  statusText: 'OK',
  headers: makeHeaders(),
  body: { message: 'Deleted successfully' },
  timeMs: Math.floor(Math.random() * 80) + 30,
  size: 28,
})

export const mockErrorResponses: Record<number, APIResponse> = {
  400: {
    status: 400,
    statusText: 'Bad Request',
    headers: makeHeaders(),
    body: { error: 'Bad Request', message: 'Invalid request parameters', details: [] },
    timeMs: 45,
    size: 72,
  },
  401: {
    status: 401,
    statusText: 'Unauthorized',
    headers: makeHeaders(),
    body: { error: 'Unauthorized', message: 'Authentication required. Provide a valid Bearer token.' },
    timeMs: 32,
    size: 84,
  },
  403: {
    status: 403,
    statusText: 'Forbidden',
    headers: makeHeaders(),
    body: { error: 'Forbidden', message: 'You do not have permission to access this resource.' },
    timeMs: 28,
    size: 90,
  },
  404: {
    status: 404,
    statusText: 'Not Found',
    headers: makeHeaders(),
    body: { error: 'Not Found', message: 'The requested resource was not found.' },
    timeMs: 38,
    size: 68,
  },
  422: {
    status: 422,
    statusText: 'Unprocessable Entity',
    headers: makeHeaders(),
    body: {
      error: 'Validation Error',
      message: 'The request body is invalid.',
      details: [
        { field: 'email', message: 'Email is required' },
        { field: 'name', message: 'Name must be at least 2 characters' },
      ],
    },
    timeMs: 55,
    size: 160,
  },
  500: {
    status: 500,
    statusText: 'Internal Server Error',
    headers: makeHeaders(),
    body: { error: 'Internal Server Error', message: 'An unexpected error occurred. Please try again later.' },
    timeMs: 1200,
    size: 98,
  },
}

export const mockUsersListResponse: APIResponse = {
  status: 200,
  statusText: 'OK',
  headers: makeHeaders(),
  body: {
    data: [
      { id: '550e8400-e29b-41d4-a716-446655440001', email: 'alex@example.com', name: 'Alex Chen', role: 'customer', created_at: '2024-01-15T10:23:00Z' },
      { id: '550e8400-e29b-41d4-a716-446655440002', email: 'maya@example.com', name: 'Maya Patel', role: 'admin', created_at: '2024-01-16T09:12:00Z' },
      { id: '550e8400-e29b-41d4-a716-446655440003', email: 'sam@example.com', name: 'Sam Rivera', role: 'customer', created_at: '2024-01-17T14:45:00Z' },
    ],
    total: 42,
    page: 1,
    limit: 10,
  },
  timeMs: 87,
  size: 512,
}

export const mockUserSingleResponse: APIResponse = {
  status: 200,
  statusText: 'OK',
  headers: makeHeaders(),
  body: { id: '550e8400-e29b-41d4-a716-446655440001', email: 'alex@example.com', name: 'Alex Chen', role: 'customer', created_at: '2024-01-15T10:23:00Z' },
  timeMs: 34,
  size: 128,
}

export const mockUserCreatedResponse: APIResponse = {
  status: 201,
  statusText: 'Created',
  headers: { ...makeHeaders(), Location: '/api/users/550e8400-e29b-41d4-a716-446655440099' },
  body: { id: '550e8400-e29b-41d4-a716-446655440099', email: 'newuser@example.com', name: 'New User', role: 'customer', created_at: new Date().toISOString() },
  timeMs: 142,
  size: 148,
}
