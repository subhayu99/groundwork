"use client";

import { Tone } from "./tones";
import { Scene, SceneNode, SceneEdge } from "./Scene";

export interface GraphVizNode {
  id: string;
  label: string;
  x: number;
  y: number;
  tone?: Tone;
}

export interface GraphVizEdge {
  a: string;
  b: string;
  tone?: Tone;
  dashed?: boolean;
}

interface Props {
  nodes: GraphVizNode[];
  edges: GraphVizEdge[];
  width?: number;
  height?: number;
  /**
   * Coordinate space the node x/y are authored in. Defaults to width/height so
   * existing callers are unaffected. Pass the original (desktop) dimensions here
   * while shrinking width/height to scale the whole drawing as a unit (nodes
   * never clip) — used for mobile-responsive sizing.
   */
  viewBoxWidth?: number;
  viewBoxHeight?: number;
  nodeRadius?: number;
  onNodeClick?: (id: string) => void;
}

/**
 * Node-and-edge graph renderer. Now a thin adapter over the shared {@link Scene}
 * primitive, so graph algorithms (BFS/DFS/Dijkstra/Union-Find) and the future
 * systems-design diagrams share one engine. Edges can be dashed and tone-colored
 * (e.g. "lost" tree edges shown red/dashed); clickable nodes are keyboard
 * operable for free via Scene.
 */
export function GraphViz({
  nodes,
  edges,
  width = 480,
  height = 380,
  viewBoxWidth,
  viewBoxHeight,
  nodeRadius = 26,
  onNodeClick,
}: Props) {
  const sceneNodes: SceneNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.x,
    y: n.y,
    label: n.label,
    tone: n.tone,
    onClick: onNodeClick ? () => onNodeClick(n.id) : undefined,
  }));
  const sceneEdges: SceneEdge[] = edges.map((e) => ({
    from: e.a,
    to: e.b,
    tone: e.tone,
    dashed: e.dashed,
  }));
  return (
    <Scene
      nodes={sceneNodes}
      edges={sceneEdges}
      width={width}
      height={height}
      viewBoxWidth={viewBoxWidth}
      viewBoxHeight={viewBoxHeight}
      nodeRadius={nodeRadius}
    />
  );
}
