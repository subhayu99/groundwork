"use client";

import { ReactNode } from "react";
import { Tone } from "./tones";
import { Scene, SceneNode, SceneEdge } from "./Scene";

export interface TreeVizNode {
  id: string;
  x: number;
  y: number;
  label: ReactNode;
  tone?: Tone;
}

export interface TreeVizEdge {
  from: string;
  to: string;
  tone?: Tone;
}

interface Props {
  nodes: TreeVizNode[];
  edges: TreeVizEdge[];
  width: number;
  height: number;
  radius?: number;
}

/**
 * Node-and-edge tree renderer. Now a thin adapter over the shared {@link Scene}
 * primitive (the org-chart / recursion-tree story), so there is one SVG
 * node/edge engine for the whole app rather than a forked copy here. Layout is
 * still the caller's job (x/y per node). Nodes fade in on mount (`appear`).
 */
export function TreeViz({ nodes, edges, width, height, radius = 20 }: Props) {
  const sceneNodes: SceneNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.x,
    y: n.y,
    label: n.label,
    tone: n.tone,
  }));
  const sceneEdges: SceneEdge[] = edges.map((e) => ({
    from: e.from,
    to: e.to,
    tone: e.tone,
  }));
  return (
    <Scene
      nodes={sceneNodes}
      edges={sceneEdges}
      width={width}
      height={height}
      nodeRadius={radius}
      appear
    />
  );
}
