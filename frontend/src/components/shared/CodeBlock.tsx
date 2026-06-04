import { CopyButton } from './CopyButton'

interface Props {
  code: string
  language?: string
  showLineNumbers?: boolean
  maxHeight?: string
}

export function CodeBlock({ code, language = 'sql', showLineNumbers = false, maxHeight = '400px' }: Props) {
  const lines = code.split('\n')

  return (
    <div className="relative surface-elevated rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="font-mono text-xs text-text-tertiary">{language}</span>
        <CopyButton text={code} />
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        <pre className="p-4 font-mono text-xs leading-relaxed text-text-code">
          {showLineNumbers
            ? lines.map((line, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-text-tertiary select-none w-6 text-right flex-shrink-0">{i + 1}</span>
                  <span>{line || ' '}</span>
                </div>
              ))
            : code}
        </pre>
      </div>
    </div>
  )
}
