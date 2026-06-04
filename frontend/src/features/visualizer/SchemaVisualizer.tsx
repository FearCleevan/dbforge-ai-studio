import { useState, useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { SchemaDefinition } from '@/types'
import { getRelationships } from '@/lib/utils/schemaHelpers'
import { TableNode } from './TableNode'
import { RelationshipEdge } from './RelationshipEdge'
import { NodeDetailPanel } from './NodeDetailPanel'
import { VisualizerToolbar } from './VisualizerToolbar'
import { useFlowLayout } from './hooks/useFlowLayout'
import { CommentThread } from '@/features/collaboration/CommentThread'
import { useProject } from '@/context/ProjectContext'
import { getCommentCounts } from '@/lib/api/comments'

const nodeTypes: NodeTypes = { tableNode: TableNode }
const edgeTypes: EdgeTypes = { relationship: RelationshipEdge }

interface Props {
  schema: SchemaDefinition | null
}

function determineCardinality(fromTableName: string, toTableName: string, schema: SchemaDefinition): '1:N' | 'N:N' | '1:1' {
  const toTable = schema.tables.find(t => t.name === toTableName)
  if (!toTable) return '1:N'
  const backRef = toTable.columns.some(c => c.references?.table === fromTableName)
  if (backRef) return 'N:N'
  return '1:N'
}

function buildNodesAndEdges(
  schema: SchemaDefinition,
  showTypes: boolean,
  compactMode: boolean,
  commentCounts: Record<string, number>,
  onOpenComments: (tableId: string) => void
) {
  const nodes: Node[] = schema.tables.map((table, i) => ({
    id: table.id,
    type: 'tableNode',
    position: { x: i * 280, y: 0 },
    data: {
      table: compactMode
        ? { ...table, columns: table.columns.filter(c => c.primaryKey || c.references) }
        : table,
      target: schema.target,
      showTypes,
      commentCount: commentCounts[table.id] ?? 0,
      onOpenComments,
    },
  }))

  const relationships = getRelationships(schema)
  const edges: Edge[] = relationships.map((rel, i) => {
    const fromTable = schema.tables.find(t => t.name === rel.fromTable)
    const toTable = schema.tables.find(t => t.name === rel.toTable)
    if (!fromTable || !toTable) return null

    // Resolve per-column handle IDs so each edge connects at the exact column row
    const fromCol = fromTable.columns.find(c => c.name === rel.fromColumn)
    const toCol = toTable.columns.find(c => c.name === rel.toColumn)

    const cardinality = determineCardinality(rel.fromTable, rel.toTable, schema)
    return {
      id: `edge-${i}`,
      source: fromTable.id,
      target: toTable.id,
      sourceHandle: fromCol ? `source-${fromCol.id}` : undefined,
      targetHandle: toCol ? `target-${toCol.id}` : undefined,
      type: 'relationship',
      data: { cardinality },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(0,212,255,0.5)', width: 12, height: 12 },
    } as Edge
  }).filter((e): e is Edge => e !== null)

  return { nodes, edges }
}

function VisualizerInner({ schema }: Props) {
  const { fitView } = useReactFlow()
  const { getLayoutedElements } = useFlowLayout()
  const { currentProject } = useProject()
  const flowRef = useRef<HTMLDivElement>(null)

  const [showTypes, setShowTypes] = useState(true)
  const [showIndexes, setShowIndexes] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [commentTableId, setCommentTableId] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const openComments = useCallback((tableId: string) => {
    setCommentTableId(prev => prev === tableId ? null : tableId)
  }, [])

  const applyLayout = useCallback((n: Node[], e: Edge[]) => {
    const { nodes: ln, edges: le } = getLayoutedElements(n, e)
    setNodes(ln)
    setEdges(le)
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50)
  }, [getLayoutedElements, setNodes, setEdges, fitView])

  useEffect(() => {
    if (!schema || schema.tables.length === 0) return
    const { nodes: n, edges: e } = buildNodesAndEdges(schema, showTypes, compactMode, commentCounts, openComments)
    applyLayout(n, e)
  }, [schema, showTypes, compactMode, commentCounts, openComments]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load comment counts when project changes
  useEffect(() => {
    if (!currentProject?.id) return
    getCommentCounts(currentProject.id)
      .then(counts => setCommentCounts(counts))
      .catch(() => { /* non-fatal */ })
  }, [currentProject?.id])

  const handleAutoLayout = useCallback(() => {
    applyLayout(nodes, edges)
  }, [nodes, edges, applyLayout])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.15, duration: 400 })
  }, [fitView])

  const handleExportPng = useCallback(() => {
    const svgEl = flowRef.current?.querySelector('.react-flow__edges') as SVGElement | null
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schema?.name ?? 'schema'}-er-diagram.svg`
    a.click()
    URL.revokeObjectURL(url)
  }, [schema])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedTable(node.id === selectedTable ? null : node.id)
  }, [selectedTable])

  const filteredNodes = searchQuery
    ? nodes.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: n.data.table.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0.25,
      },
    }))
    : nodes

  const selectedTableDef = schema?.tables.find(t => t.id === selectedTable) ?? null

  if (!schema || schema.tables.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
        Generate a schema to see the ER diagram
      </div>
    )
  }

  return (
    <div className="flex-1 relative overflow-hidden" ref={flowRef}>
      <VisualizerToolbar
        onAutoLayout={handleAutoLayout}
        onFitView={handleFitView}
        onExportPng={handleExportPng}
        showTypes={showTypes}
        showIndexes={showIndexes}
        compactMode={compactMode}
        onToggleTypes={() => setShowTypes(v => !v)}
        onToggleIndexes={() => setShowIndexes(v => !v)}
        onToggleCompact={() => setCompactMode(v => !v)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={() => setSelectedTable(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null}
        className="bg-bg-base"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}   // tighter spacing for a denser dot grid
          size={1.5} // slightly larger dots for better visibility
          color="rgba(255,255,255,0.07)" // subtle but crisp
        />
        <Controls
          className="!bottom-8 !right-4 !left-auto !top-auto"
          showInteractive={false}
        />
        <MiniMap
          nodeColor="rgba(0,212,255,0.3)"
          maskColor="rgba(10,12,16,0.7)"
          className="!bottom-8 !right-28"
          style={{ background: 'rgba(18,20,26,0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}
        />
      </ReactFlow>

      {selectedTableDef && schema && (
        <NodeDetailPanel
          table={selectedTableDef}
          allTables={schema.tables}
          onClose={() => setSelectedTable(null)}
        />
      )}

      {commentTableId && currentProject?.id && (() => {
        const table = schema?.tables.find(t => t.id === commentTableId)
        return table ? (
          <CommentThread
            projectId={currentProject.id}
            tableId={table.id}
            tableName={table.name}
            onClose={() => setCommentTableId(null)}
          />
        ) : null
      })()}
    </div>
  )
}

export function SchemaVisualizer({ schema }: Props) {
  return (
    <ReactFlowProvider>
      <VisualizerInner schema={schema} />
    </ReactFlowProvider>
  )
}
