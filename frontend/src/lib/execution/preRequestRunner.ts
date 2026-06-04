import { APIRequest, KeyValuePair } from '@/types'

export interface PreRequestResult {
  request:     APIRequest
  consoleLogs: string[]
  variables:   Record<string, string>
  error?:      string
}

export function runPreRequestScript(
  script: string,
  request: APIRequest,
  envVars: KeyValuePair[]
): PreRequestResult {
  const consoleLogs: string[] = []
  const variables: Record<string, string> = {}
  const varMap: Record<string, string> = Object.fromEntries(
    envVars.filter(v => v.enabled).map(v => [v.key, v.value])
  )

  const mutableRequest = JSON.parse(JSON.stringify(request)) as APIRequest

  const pm = {
    request: {
      url: {
        get:    ()    => mutableRequest.url,
        set:    (u: string) => { mutableRequest.url = u },
      },
      headers: {
        get:    (key: string) => mutableRequest.headers.find(h => h.key === key)?.value,
        add:    (kv: { key: string; value: string }) => {
          mutableRequest.headers.push({ id: crypto.randomUUID(), key: kv.key, value: kv.value, enabled: true })
        },
        remove: (key: string) => { mutableRequest.headers = mutableRequest.headers.filter(h => h.key !== key) },
      },
      body: {
        get: ()  => mutableRequest.body ?? '',
        set: (b: string) => { mutableRequest.body = b },
      },
    },
    variables: {
      get: (key: string) => varMap[key] ?? variables[key],
      set: (key: string, val: string) => { variables[key] = val },
    },
    environment: {
      get: (key: string) => varMap[key],
    },
  }

  const fakeConsole = {
    log:   (...args: unknown[]) => consoleLogs.push(args.map(a => String(a)).join(' ')),
    error: (...args: unknown[]) => consoleLogs.push('[error] ' + args.map(a => String(a)).join(' ')),
    warn:  (...args: unknown[]) => consoleLogs.push('[warn] ' + args.map(a => String(a)).join(' ')),
  }

  try {
    const fn = new Function('pm', 'console', script) // eslint-disable-line no-new-func
    fn(pm, fakeConsole)
    return { request: mutableRequest, consoleLogs, variables }
  } catch (err: unknown) {
    return { request: mutableRequest, consoleLogs, variables, error: (err as Error).message }
  }
}

export function resolveVariables(text: string, vars: KeyValuePair[]): string {
  const map = Object.fromEntries(vars.filter(v => v.enabled).map(v => [v.key, v.value]))
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => map[key] ?? `{{${key}}}`)
}
