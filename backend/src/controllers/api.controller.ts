import { Response } from 'express'
import { z } from 'zod'
import axios, { AxiosRequestConfig } from 'axios'
import { AuthRequest } from '../middleware/auth'

const KeyValuePair = z.object({
  key:     z.string(),
  value:   z.string(),
  enabled: z.boolean(),
})

const ProxyRequestSchema = z.object({
  method:    z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  url:       z.string().url(),
  headers:   z.array(KeyValuePair).default([]),
  params:    z.array(KeyValuePair).default([]),
  body:      z.string().optional(),
  bodyType:  z.enum(['json', 'form-data', 'raw', 'none']).default('none'),
  authType:  z.enum(['none', 'bearer', 'basic', 'api-key']).default('none'),
  authValue: z.string().optional(),
})

export async function proxyRequest(req: AuthRequest, res: Response): Promise<void> {
  const parsed = ProxyRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const { method, url, headers, params, body, bodyType, authType, authValue } = parsed.data

  const headerMap: Record<string, string> = {}
  headers.filter(h => h.enabled && h.key).forEach(h => { headerMap[h.key] = h.value })

  if (authType === 'bearer' && authValue) {
    headerMap['Authorization'] = `Bearer ${authValue}`
  } else if (authType === 'basic' && authValue) {
    headerMap['Authorization'] = `Basic ${Buffer.from(authValue).toString('base64')}`
  } else if (authType === 'api-key' && authValue) {
    headerMap['X-API-Key'] = authValue
  }

  const queryParams: Record<string, string> = {}
  params.filter(p => p.enabled && p.key).forEach(p => { queryParams[p.key] = p.value })

  let requestBody: unknown = undefined
  if (bodyType === 'json' && body) {
    try { requestBody = JSON.parse(body) } catch { requestBody = body }
    headerMap['Content-Type'] = 'application/json'
  } else if (bodyType === 'raw' && body) {
    requestBody = body
  }

  const config: AxiosRequestConfig = {
    method,
    url,
    headers:        headerMap,
    params:         Object.keys(queryParams).length > 0 ? queryParams : undefined,
    data:           requestBody,
    timeout:        15_000,
    validateStatus: () => true,
  }

  const start = Date.now()
  try {
    const response   = await axios(config)
    const timeMs     = Date.now() - start
    const bodyStr    = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data)
    res.json({
      status:     response.status,
      statusText: response.statusText,
      headers:    response.headers as Record<string, string>,
      body:       response.data,
      timeMs,
      size:       Buffer.byteLength(bodyStr, 'utf8'),
    })
  } catch (err: unknown) {
    const timeMs = Date.now() - start
    res.status(422).json({ error: 'Request failed', message: (err as Error).message, timeMs })
  }
}
