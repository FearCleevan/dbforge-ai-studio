import { memo } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'

interface RelationshipEdgeData {
  label?: string
  cardinality?: '1:N' | 'N:N' | '1:1'
}

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationshipEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const label = data?.cardinality ?? data?.label ?? '1:N'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? 'rgba(0,212,255,0.8)' : 'rgba(0,212,255,0.4)',
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: selected ? '6 3' : undefined,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <span className="font-mono text-[10px] text-cyan/80 bg-bg-base border border-cyan/20 rounded px-1 py-0.5 leading-none">
            {label}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const RelationshipEdge = memo(RelationshipEdgeComponent)
