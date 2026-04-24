/**
 * Roadmap.jsx — Step 5: Visual interactive learning roadmap with ReactFlow
 */
import { useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Route, Sparkles, RotateCcw, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { getSession, setRoadmapSequence } from '../services/knowledgeModel';

/* ── Custom Node Component ── */
function ConceptNode({ data }) {
  const tierColors = {
    foundation: { bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-300', ring: 'ring-violet-500/30' },
    bridge: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', ring: 'ring-amber-500/30' },
    core: { bg: 'bg-guru-500/20', border: 'border-guru-500/40', text: 'text-guru-300', ring: 'ring-guru-500/30' },
    extension: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', ring: 'ring-emerald-500/30' },
  };

  const colors = tierColors[data.tier] || tierColors.core;
  const mastery = Math.round((data.mastery || 0) * 100);

  return (
    <div
      className={`px-5 py-4 rounded-2xl border-2 ${colors.border} ${colors.bg} backdrop-blur-sm min-w-[180px] max-w-[220px]
        transition-all duration-200 hover:scale-[1.03] hover:shadow-lg cursor-grab
        ${data.isActive ? `ring-2 ${colors.ring} shadow-lg` : ''}
        ${data.isLocked ? 'opacity-50' : ''}`}
      style={{ background: 'rgba(20, 21, 30, 0.85)' }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#475569', width: 8, height: 8 }} />
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>
          {data.tierLabel}
        </span>
        <span className="text-[10px] text-surface-500 font-mono">#{data.step}</span>
      </div>

      <h4 className="text-sm font-semibold text-surface-100 leading-snug mb-2">{data.label}</h4>

      <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            mastery >= 70 ? 'bg-emerald-500' : mastery > 0 ? 'bg-amber-500' : 'bg-surface-600'
          }`}
          style={{ width: `${mastery}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${mastery >= 70 ? 'text-emerald-400' : mastery > 0 ? 'text-amber-400' : 'text-surface-500'}`}>
          {mastery}%
        </span>
        <div className="flex items-center gap-1">
          {data.hasMisconception && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
          {data.isLocked && <Lock className="w-3.5 h-3.5 text-surface-500" />}
          {mastery >= 70 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#475569', width: 8, height: 8 }} />
    </div>
  );
}

const nodeTypes = { concept: ConceptNode };

export default function Roadmap() {
  const { navigate, notify } = useSession();
  const [session, setLocalSession] = useState(null);
  const [rounds, setRounds] = useState(0);
  const maxRounds = 3;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const s = getSession();
    setLocalSession(s);
  }, []);

  useEffect(() => {
    if (!session) return;

    const dr = session.diagnosticResults;
    const sequence = dr?.roadmapRecommendation || Object.keys(session.concepts);
    const tierEmoji = { foundation: '🧱 Foundation', bridge: '🌉 Bridge', core: '⚡ Core', extension: '🚀 Extension' };

    const COLS = 3;
    const X_GAP = 280;
    const Y_GAP = 160;

    const flowNodes = sequence.map((conceptId, idx) => {
      const concept = session.concepts[conceptId];
      if (!concept) return null;

      // Clean horizontal layout (Left to Right)
      const x = idx * 320;
      // Stagger Y slightly based on tier to make it look organic
      const yTier = concept.tier === 'foundation' ? 0 : concept.tier === 'bridge' ? 120 : concept.tier === 'core' ? 240 : 360;
      const y = yTier + (Math.sin(idx) * 40); // slight wave

      return {
        id: conceptId,
        type: 'concept',
        position: { x: x + 50, y: y + 50 },
        data: {
          label: concept.name,
          tier: concept.tier,
          tierLabel: tierEmoji[concept.tier] || concept.tier,
          mastery: concept.masteryScore,
          hasMisconception: concept.activeMisconceptions.length > 0,
          isLocked: concept.prerequisites.length > 0 && !concept.prerequisites.every(pid => {
            const p = session.concepts[pid];
            return p && p.masteryScore >= 0.4;
          }),
          isActive: idx === (session.roadmap.currentIndex || 0),
          step: idx + 1,
        },
      };
    }).filter(Boolean);

    const flowEdges = [];
    for (let i = 0; i < sequence.length - 1; i++) {
      if (session.concepts[sequence[i]] && session.concepts[sequence[i + 1]]) {
        flowEdges.push({
          id: `e-${sequence[i]}-${sequence[i + 1]}`,
          source: sequence[i],
          target: sequence[i + 1],
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6d5acd', strokeWidth: 2, opacity: 0.6 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6d5acd',
            width: 16,
            height: 16,
          },
        });
      }
    }

    Object.values(session.concepts).forEach(c => {
      (c.prerequisites || []).forEach(pid => {
        const edgeId = `dep-${pid}-${c.id}`;
        if (session.concepts[pid] && !flowEdges.find(e => e.id === edgeId)) {
          const hasSequenceEdge = flowEdges.find(e => e.source === pid && e.target === c.id);
          if (!hasSequenceEdge) {
            flowEdges.push({
              id: edgeId,
              source: pid,
              target: c.id,
              type: 'smoothstep',
              style: { stroke: '#334155', strokeWidth: 1, strokeDasharray: '6 4', opacity: 0.4 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#334155',
                width: 12,
                height: 12,
              },
            });
          }
        }
      });
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [session, setNodes, setEdges]);

  if (!session) return null;

  const dr = session.diagnosticResults;
  const sequence = dr?.roadmapRecommendation || Object.keys(session.concepts);

  function handleAgree() {
    setRoadmapSequence(sequence);
    notify('Roadmap locked! Let\'s begin learning.', 'success');
    navigate('teaching');
  }

  function handleDisagree() {
    if (rounds >= maxRounds - 1) {
      notify('Maximum adjustments reached. Proceeding with current roadmap.', 'info');
      handleAgree();
      return;
    }
    setRounds(rounds + 1);
    notify(`Adjustment round ${rounds + 1} of ${maxRounds}`, 'info');
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-guru-500/10 border border-guru-500/20">
            <Route className="w-4 h-4 text-guru-400" />
            <span className="text-sm font-medium text-guru-300">Personalized Learning Path</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-surface-100">Your Learning Roadmap</h2>
          <p className="text-surface-400 max-w-lg mx-auto">
            This interactive path is ordered by prerequisites, diagnostic results, and difficulty.
            Drag nodes to rearrange. Animated arrows show your learning sequence.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          {[
            { label: 'Foundation', color: 'bg-violet-500' },
            { label: 'Bridge', color: 'bg-amber-500' },
            { label: 'Core', color: 'bg-guru-500' },
            { label: 'Extension', color: 'bg-emerald-500' },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-surface-400">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-surface-400">
            <span className="w-6 h-0.5 bg-guru-500 rounded" style={{ display: 'inline-block' }} />
            Learning path
          </span>
          <span className="flex items-center gap-1.5 text-xs text-surface-400">
            <span className="w-6 h-0.5 rounded" style={{ display: 'inline-block', borderTop: '2px dashed #334155' }} />
            Prerequisite
          </span>
        </div>

        <div className="bento-card overflow-hidden" style={{ height: '500px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: '#0F1014' }}
          >
            <Background color="#1E1F2E" gap={24} size={1} />
            <Controls
              showInteractive={false}
              className="!bg-surface !border-surface-border !rounded-xl !shadow-lg"
            />
            <MiniMap
              nodeColor={(n) => {
                const tier = n.data?.tier;
                if (tier === 'foundation') return '#8b5cf6';
                if (tier === 'bridge') return '#f59e0b';
                if (tier === 'core') return '#6d5acd';
                if (tier === 'extension') return '#10b981';
                return '#475569';
              }}
              className="!bg-[#14151A] !border-surface-border !rounded-xl"
              maskColor="rgba(15, 16, 20, 0.7)"
            />
          </ReactFlow>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Concepts', value: sequence.length, color: 'text-guru-400' },
            { label: 'Foundation', value: sequence.filter(id => session.concepts[id]?.tier === 'foundation').length, color: 'text-violet-400' },
            { label: 'Core', value: sequence.filter(id => session.concepts[id]?.tier === 'core').length, color: 'text-guru-400' },
            { label: 'Extension', value: sequence.filter(id => session.concepts[id]?.tier === 'extension').length, color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="bento-card p-3 text-center">
              <p className="text-xs text-surface-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-xl font-display font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <button onClick={handleAgree} className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg" id="agree-roadmap-btn">
            <Sparkles className="w-5 h-5" /> Looks Good — Start Learning!
          </button>
          {rounds < maxRounds && (
            <button onClick={handleDisagree} className="btn-secondary flex items-center justify-center gap-2" id="disagree-roadmap-btn">
              <RotateCcw className="w-4 h-4" /> Suggest Changes ({maxRounds - rounds} left)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
