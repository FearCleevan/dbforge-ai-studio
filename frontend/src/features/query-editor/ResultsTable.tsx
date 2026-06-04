import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { QueryResult } from '@/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  result: QueryResult
}

type SortDir = 'asc' | 'desc' | null

export function ResultsTable({ result }: Props) {
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc')
      if (sortDir === 'desc') setSortCol(null)
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const sorted = [...result.rows].sort((a, b) => {
    if (!sortCol || !sortDir) return 0
    const av = a[sortCol]
    const bv = b[sortCol]
    if (av === null) return 1
    if (bv === null) return -1
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (result.columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm font-mono">
        No results
      </div>
    )
  }

  const isNumeric = (col: string) =>
    result.rows.some(r => typeof r[col] === 'number' || (typeof r[col] === 'string' && !isNaN(Number(r[col])) && r[col] !== ''))

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-bg-elevated">
          <tr className="border-b border-white/5">
            {result.columns.map(col => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                className="text-left px-3 py-2 text-text-tertiary font-mono uppercase tracking-wider text-[10px] cursor-pointer hover:text-text-secondary whitespace-nowrap select-none"
              >
                <div className={cn('flex items-center gap-1', isNumeric(col) && 'justify-end')}>
                  <span>{col}</span>
                  {sortCol === col && sortDir === 'asc' && <ChevronUp size={10} />}
                  {sortCol === col && sortDir === 'desc' && <ChevronDown size={10} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className={cn(
                'border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors',
                i % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-elevated'
              )}
            >
              {result.columns.map(col => {
                const val = row[col]
                const numeric = isNumeric(col)
                return (
                  <td key={col} className={cn('px-3 py-1.5 font-mono text-xs whitespace-nowrap', numeric && 'text-right')}>
                    {val === null || val === undefined ? (
                      <span className="text-text-tertiary italic">NULL</span>
                    ) : typeof val === 'object' ? (
                      <span className="text-text-tertiary">{JSON.stringify(val)}</span>
                    ) : typeof val === 'boolean' ? (
                      <span className={val ? 'text-emerald' : 'text-error'}>{String(val)}</span>
                    ) : numeric ? (
                      <span className="text-warning">{String(val)}</span>
                    ) : (
                      <span className="text-text-code">{String(val)}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
