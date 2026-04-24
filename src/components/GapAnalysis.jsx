/**
 * GapAnalysis.jsx — Step 4: Show diagnostic results + concept-by-concept gap analysis
 */
import { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle, CheckCircle2, XCircle, MinusCircle, ChevronRight } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { getSession } from '../services/knowledgeModel';

export default function GapAnalysis() {
  const { navigate } = useSession();
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  if (!session || !session.diagnosticResults) return null;

  const dr = session.diagnosticResults;
  const levelColors = {
    'strong': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle2 },
    'partial': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: MinusCircle },
    'weak': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: XCircle },
    'not-studied': { bg: 'bg-surface-700/30', text: 'text-surface-500', border: 'border-surface-600/20', icon: MinusCircle },
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-guru-500/10 border border-guru-500/20">
            <BarChart3 className="w-4 h-4 text-guru-400" />
            <span className="text-sm font-medium text-guru-300">Gap Analysis Complete</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-surface-100">Here's Where You Stand</h2>
          <p className="text-surface-400">The AI has mapped your current understanding of <span className="text-surface-200 font-medium">{session.mainTopic}</span></p>
        </div>

        {/* Overall level card */}
        <div className="bento-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-surface-400">Overall Level</p>
            <p className="text-2xl font-display font-bold text-surface-100 capitalize">{dr.overallLevel}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-surface-400">Prior Strength</p>
            <p className="text-2xl font-display font-bold text-guru-400">{Math.round((dr.priorStrength || 0) * 100)}%</p>
          </div>
        </div>

        {/* Concept-by-concept table */}
        <div className="bento-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-surface-100">Concept-by-Concept Analysis</h3>
          <div className="space-y-3">
            {(dr.conceptAnalysis || []).map((ca) => {
              const concept = session.concepts[ca.conceptId];
              const level = levelColors[ca.detectedLevel] || levelColors['not-studied'];
              const Icon = level.icon;
              return (
                <div key={ca.conceptId} className={`flex items-start gap-4 p-4 rounded-xl border ${level.border} ${level.bg}`}>
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${level.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-surface-100">{concept?.name || ca.conceptId}</p>
                      <span className={`text-xs font-medium capitalize ${level.text}`}>{ca.detectedLevel}</span>
                      <span className="text-xs text-surface-500">{Math.round((ca.masteryEstimate || 0) * 100)}%</span>
                    </div>
                    {ca.specificIssue && ca.specificIssue !== 'None' && (
                      <p className="text-sm text-surface-400 mt-1">{ca.specificIssue}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Misconceptions found */}
        {dr.misconceptionsFound && dr.misconceptionsFound.length > 0 && (
          <div className="bento-card p-6 space-y-4 border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-red-300">Misconceptions Detected</h3>
            </div>
            <div className="space-y-3">
              {dr.misconceptionsFound.map((m, i) => (
                <div key={i} className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                  <p className="font-medium text-red-300">{m.name}</p>
                  <p className="text-sm text-surface-400 mt-1">{m.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-surface-500">Severity:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(s => (
                        <div key={s} className={`w-2 h-2 rounded-full ${s <= m.severity ? 'bg-red-400' : 'bg-surface-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        <div className="flex justify-center pt-4">
          <button onClick={() => navigate('roadmap')} className="btn-primary flex items-center gap-2 px-8 py-4 text-lg" id="view-roadmap-btn">
            View Your Learning Roadmap <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
