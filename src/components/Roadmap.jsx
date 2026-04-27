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
    foundation: { bg: 'bg-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400', shadow: 'shadow-violet-500/5' },
    bridge: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', shadow: 'shadow-amber-500/5' },
    core: { bg: 'bg-guru-500/5', border: 'border-guru-500/20', text: 'text-guru-400', shadow: 'shadow-guru-500/5' },
    extension: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', shadow: 'shadow-emerald-500/5' },
  };

  const colors = tierColors[data.tier] || tierColors.core;
  const mastery = Math.round((data.mastery || 0) * 100);

  return (
    <div
      className={`px-6 py-4 rounded-2xl border-2 ${colors.border} ${colors.bg} backdrop-blur-xl min-w-[240px]
        transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${colors.shadow} cursor-pointer
        ${data.isActive ? 'ring-2 ring-brand-gold shadow-brand-gold/10 scale-[1.05] bg-surface-900/80' : ''}
        ${data.isLocked ? 'opacity-30 grayscale' : ''}`}
      style={{ background: 'rgba(15, 16, 20, 0.9)' }}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-surface-600" />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${mastery >= 70 ? 'bg-emerald-500' : mastery > 0 ? 'bg-amber-500' : 'bg-surface-700'}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>
            {data.tierLabel}
          </span>
        </div>
        <span className="text-[10px] text-surface-600 font-mono font-bold">STEP {data.step}</span>
      </div>

      <h4 className="text-base font-display font-bold text-white leading-tight mb-3">{data.label}</h4>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-1.5 bg-surface-800/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              mastery >= 70 ? 'bg-emerald-500' : mastery > 0 ? 'bg-amber-500' : 'bg-surface-700'
            }`}
            style={{ width: `${mastery}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {data.hasMisconception && <AlertTriangle className="w-4 h-4 text-red-400" />}
          {mastery >= 70 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {data.isLocked && <Lock className="w-4 h-4 text-surface-600" />}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-surface-600" />
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

    const flowNodes = sequence.map((conceptId, idx) => {
      const concept = session.concepts[conceptId];
      if (!concept) return null;

      // Vertical roadmap.sh style
      const x = 0; // Centered
      const y = idx * 150;

      return {
        id: conceptId,
        type: 'concept',
        position: { x, y },
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
          type: 'simplebezier',
          animated: true,
          style: { stroke: '#6d5acd', strokeWidth: 4, opacity: 0.4 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6d5acd',
            width: 15,
            height: 15,
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

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center mx-auto">
            <Route className="w-10 h-10 text-surface-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-surface-100">No Roadmap Yet</h2>
            <p className="text-surface-400">Once you upload a topic and complete the diagnostic, we'll build your personalized learning path here.</p>
          </div>
          <button onClick={() => navigate('upload')} className="btn-primary w-full py-3">
            Start Your First Session
          </button>
        </div>
      </div>
    );
  }

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
            A structured vertical path designed to optimize your learning flow. 
            Each checkpoint is a milestone based on prerequisites and your diagnostic performance.
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
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: '#0F1014' }}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnScroll={false}
            panOnDrag={true}
          >
            <Background color="#1E1F2E" gap={40} size={1} opacity={0.2} />
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
