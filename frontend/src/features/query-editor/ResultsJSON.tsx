import { QueryResult } from '@/types'
import { CopyButton } from '@/components/shared/CopyButton'

interface Props {
  result: QueryResult
}

export function ResultsJSON({ result }: Props) {
  const json = JSON.stringify(result.rows, null, 2)

  return (
    <div className="flex-1 relative overflow-auto">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={json} />
      </div>
      <pre className="p-4 font-mono text-xs text-text-code leading-relaxed">
        {json}
      </pre>
    </div>
  )
}
