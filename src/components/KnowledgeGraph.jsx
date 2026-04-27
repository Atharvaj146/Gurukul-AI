/**
 * KnowledgeGraph.jsx — D3.js force-directed knowledge graph
 * Nodes = concepts, edges = prerequisite relationships
 * Color = mastery level, pulsing = overdue for review
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useSession } from '../context/SessionContext';
import { getSession, getMasteryColor } from '../services/knowledgeModel';

export default function KnowledgeGraph({ onNodeClick, width = 700, height = 500 }) {
  const svgRef = useRef(null);
  const [session, setLocalSession] = useState(null);

  useEffect(() => {
    const handler = () => setLocalSession(getSession());
    window.addEventListener('session-updated', handler);
    setLocalSession(getSession());
    return () => window.removeEventListener('session-updated', handler);
  }, []);

  useEffect(() => {
    if (!session || !svgRef.current) return;

    const concepts = Object.values(session.concepts);
    if (concepts.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const colorMap = {
      gray: { fill: '#1e293b', stroke: '#334155', glow: '#475569' },
      red: { fill: '#7f1d1d', stroke: '#ef4444', glow: '#ef4444' },
      yellow: { fill: '#78350f', stroke: '#f59e0b', glow: '#f59e0b' },
      green: { fill: '#064e3b', stroke: '#10b981', glow: '#10b981' },
    };

    // Build nodes and links
    const nodes = concepts.map(c => ({
      id: c.id,
      name: c.name,
      mastery: c.masteryScore,
      color: getMasteryColor(c.masteryScore),
      overdue: c.nextReviewAt && c.nextReviewAt < Date.now() && c.totalAnswered > 0,
      tier: c.tier,
    }));

    const links = [];
    concepts.forEach(c => {
      (c.prerequisites || []).forEach(pid => {
        if (session.concepts[pid]) {
          links.push({ source: pid, target: c.id });
        }
      });
    });

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45));

    // Defs for glow filters
    const defs = svg.append('defs');
    Object.entries(colorMap).forEach(([key, val]) => {
      const filter = defs.append('filter').attr('id', `glow-${key}`);
      filter.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'coloredBlur');
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrowhead').attr('viewBox', '-0 -5 10 10')
      .attr('refX', 30).attr('refY', 0).attr('orient', 'auto')
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .append('path').attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#475569');

    // Links (energy lines)
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.8)
      .attr('marker-end', 'url(#arrowhead)');

    // Node groups
    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (e, d) => {
        if (onNodeClick) onNodeClick(d.id);
      });

    // Node circles (Glowing Orbs)
    nodeGroup.append('circle')
      .attr('r', 22)
      .attr('fill', d => colorMap[d.color].fill)
      .attr('stroke', d => colorMap[d.color].stroke)
      .attr('stroke-width', 3)
      .attr('filter', d => `url(#glow-${d.color})`);

    // Overdue pulsing aura
    nodeGroup.filter(d => d.overdue)
      .append('circle')
      .attr('r', 22)
      .attr('fill', 'none')
      .attr('stroke', d => colorMap[d.color].stroke)
      .attr('stroke-width', 2)
      .attr('opacity', 0.5)
      .each(function () {
        const el = d3.select(this);
        function pulse() {
          el.transition().duration(1200).attr('r', 35).attr('opacity', 0)
            .transition().duration(0).attr('r', 22).attr('opacity', 0.8)
            .on('end', pulse);
        }
        pulse();
      });

    // Mastery percentage inside node
    nodeGroup.append('text')
      .text(d => d.mastery > 0 ? `${Math.round(d.mastery * 100)}` : '')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .attr('font-weight', '700');

    // Name Labels below node
    nodeGroup.append('text')
      .text(d => d.name.length > 16 ? d.name.slice(0, 14) + '…' : d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', '38')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-weight', '500');

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [session, width, height]);

  return (
    <div className="bento-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-surface-300">Knowledge Graph</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-surface-500" /> Not started</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Weak</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Learning</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Strong</span>
        </div>
      </div>
      <svg ref={svgRef} width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`} />
    </div>
  );
}
