"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

type GraphNode = {
  id: number;
  label: string;
  down: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

type GraphLink = {
  source: number | GraphNode;
  target: number | GraphNode;
};

export function TopologyCanvas({
  nodes,
  links,
}: {
  nodes: { id: number; label: string; down: boolean }[];
  links: { nodeIdA: number; nodeIdB: number }[];
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = svgRef.current.clientWidth || 900;
    const height = 560;

    const simNodes: GraphNode[] = nodes.map((n) => ({ ...n }));
    const nodeIndex = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks: GraphLink[] = links
      .filter((l) => nodeIndex.has(l.nodeIdA) && nodeIndex.has(l.nodeIdB))
      .map((l) => ({ source: l.nodeIdA, target: l.nodeIdB }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const zoomLayer = svg.append("g");

    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on("zoom", (event) => {
          zoomLayer.attr("transform", event.transform);
        })
    );

    const linkSel = zoomLayer
      .append("g")
      .attr("stroke", "var(--border-strong)")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke-width", 1.5);

    const nodeGroup = zoomLayer
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(simNodes)
      .join("g")
      .style("cursor", "grab");

    nodeGroup
      .append("circle")
      .attr("r", 9)
      .attr("fill", (d) => (d.down ? "var(--status-down)" : "var(--status-up)"))
      .attr("stroke", "var(--bg-canvas)")
      .attr("stroke-width", 2);

    nodeGroup
      .append("text")
      .text((d) => d.label)
      .attr("x", 13)
      .attr("y", 4)
      .attr("font-size", 11)
      .attr("fill", "var(--text-secondary)")
      .style("pointer-events", "none");

    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(simLinks)
          .id((d) => d.id)
          .distance(90)
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(28));

    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroup.call(drag);

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={560}
      style={{ background: "var(--bg-page)", borderRadius: "var(--radius-lg)" }}
    />
  );
}
