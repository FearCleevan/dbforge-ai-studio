import { APIResponse, APITest, ScriptTestResult } from '@/types'

interface PMApi {
  response: {
    status: number
    statusText: string
    body: unknown
    headers: Record<string, string>
    timeMs: number
    json: () => unknown
  }
  expect: (value: unknown) => PMExpectation
  test: (name: string, fn: () => void) => void
  variables: {
    get: (key: string) => string | undefined
    set: (key: string, value: string) => void
  }
}

interface PMExpectation {
  to: {
    equal: (expected: unknown) => void
    be: {
      above: (n: number) => void
      below: (n: number) => void
      a: (type: string) => void
    }
    include: (value: unknown) => void
    have: {
      status: (code: number) => void
      property: (key: string) => void
    }
  }
  not: {
    equal: (expected: unknown) => void
    be: {
      null: void
    }
  }
}

export interface TestRunnerResult {
  scriptTests: ScriptTestResult[]
  consoleLogs: string[]
  variables:   Record<string, string>
}

export function runTestScript(script: string, response: APIResponse): TestRunnerResult {
  const scriptTests: ScriptTestResult[] = []
  const consoleLogs: string[] = []
  const variables: Record<string, string> = {}

  const pm: PMApi = {
    response: {
      status:     response.status,
      statusText: response.statusText,
      body:       response.body,
      headers:    response.headers,
      timeMs:     response.timeMs,
      json:       () => response.body,
    },
    expect: (value: unknown) => makeExpectation(value),
    test: (name: string, fn: () => void) => {
      try {
        fn()
        scriptTests.push({ name, passed: true })
      } catch (err: unknown) {
        scriptTests.push({ name, passed: false, error: (err as Error).message })
      }
    },
    variables: {
      get: (key: string) => variables[key],
      set: (key: string, val: string) => { variables[key] = val },
    },
  }

  const fakeConsole = {
    log:   (...args: unknown[]) => consoleLogs.push(args.map(a => String(a)).join(' ')),
    error: (...args: unknown[]) => consoleLogs.push('[error] ' + args.map(a => String(a)).join(' ')),
    warn:  (...args: unknown[]) => consoleLogs.push('[warn] ' + args.map(a => String(a)).join(' ')),
  }

  try {
    const fn = new Function('pm', 'console', script) // eslint-disable-line no-new-func
    const timeout = setTimeout(() => { throw new Error('Test script timeout (3s)') }, 3000)
    fn(pm, fakeConsole)
    clearTimeout(timeout)
  } catch (err: unknown) {
    if (scriptTests.length === 0) {
      scriptTests.push({ name: 'Script execution', passed: false, error: (err as Error).message })
    }
  }

  return { scriptTests, consoleLogs, variables }
}

function makeExpectation(actual: unknown): PMExpectation {
  function assert(cond: boolean, msg: string) {
    if (!cond) throw new Error(msg)
  }

  return {
    to: {
      equal: (expected) => assert(actual === expected, `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`),
      be: {
        above: (n) => assert((actual as number) > n, `Expected ${actual} to be above ${n}`),
        below: (n) => assert((actual as number) < n, `Expected ${actual} to be below ${n}`),
        a:     (type) => assert(typeof actual === type || (type === 'array' && Array.isArray(actual)), `Expected ${typeof actual} to be a ${type}`),
      },
      include: (val) => {
        if (typeof actual === 'string') assert(actual.includes(String(val)), `Expected "${actual}" to include "${val}"`)
        else if (Array.isArray(actual)) assert(actual.includes(val), `Expected array to include ${val}`)
        else throw new Error(`include() not supported for ${typeof actual}`)
      },
      have: {
        status: (code) => assert((actual as { status: number }).status === code, `Expected status ${(actual as { status: number }).status} to be ${code}`),
        property: (key) => assert(key in (actual as object), `Expected object to have property "${key}"`),
      },
    },
    not: {
      equal: (expected) => assert(actual !== expected, `Expected ${JSON.stringify(actual)} to not equal ${JSON.stringify(expected)}`),
      be: {
        get null() { assert(actual !== null, `Expected value to not be null`); return undefined as never },
      },
    },
  }
}

export function autoTestsToAPITests(results: ScriptTestResult[]): APITest[] {
  return results.map(r => ({
    id:        crypto.randomUUID(),
    name:      r.name,
    assertion: r.name,
    type:      'schema' as const,
    expected:  'pass',
    result:    r.passed ? 'pass' : 'fail',
    error:     r.error,
  }))
}
