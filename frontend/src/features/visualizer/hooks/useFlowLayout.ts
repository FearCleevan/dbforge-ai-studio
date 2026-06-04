import { useCallback } from 'react'
import { Node, Edge } from 'reactflow'
import dagre from '@dagrejs/dagre'

const NODE_WIDTH = 220
const NODE_HEADER_HEIGHT = 48
const NODE_ROW_HEIGHT = 28

export function useFlowLayout() {
  const getLayoutedElements = useCallback((nodes: Node[], edges: Edge[]) => {
    const graph = new dagre.graphlib.Graph()
    graph.setDefaultEdgeLabel(() => ({}))
    graph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 })

    nodes.forEach(node => {
      const colCount = (node.data?.columns?.length ?? 0)
      const height = NODE_HEADER_HEIGHT + colCount * NODE_ROW_HEIGHT + 16
      graph.setNode(node.id, { width: NODE_WIDTH, height })
    })

    edges.forEach(edge => {
      graph.setEdge(edge.source, edge.target)
    })

    dagre.layout(graph)

    const layoutedNodes = nodes.map(node => {
      const { x, y } = graph.node(node.id)
      const colCount = (node.data?.columns?.length ?? 0)
      const height = NODE_HEADER_HEIGHT + colCount * NODE_ROW_HEIGHT + 16
      return {
        ...node,
        position: { x: x - NODE_WIDTH / 2, y: y - height / 2 },
      }
    })

    return { nodes: layoutedNodes, edges }
  }, [])

  return { getLayoutedElements }
}
