/**
 * Roadmap.jsx — Step 5: Visual learning roadmap with agree/disagree loop
 */
import { useState, useEffect } from 'react';
import { Route, CheckCircle2, Lock, AlertTriangle, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { getSession, setRoadmapSequence, updateSessionStatus } from '../services/knowledgeModel';

export default function Roadmap() {
  const { navigate, notify } = useSession();
  const [session, setLocalSession] = useState(null);
  const [rounds, setRounds] = useState(0);
  const maxRounds = 3;

  useEffect(() => {
    const s = getSession();
    setLocalSession(s);
    if (s && s.diagnosticResults?.roadmapRecommendation) {
      // Roadmap already generated from diagnostic analysis
    }
  }, []);

  if (!session) return null;

  const dr = session.diagnosticResults;
  const sequence = dr?.roadmapRecommendation || Object.keys(session.concepts);

  const tierEmoji = { foundation: '🧱', bridge: '🌉', core: '⚡', extension: '🚀' };
  const tierLabel = { foundation: 'Foundation', bridge: 'Bridge', core: 'Core', extension: 'Extension' };

  function handleAgree() {
    setRoadmapSequence(sequence);
    notify('Roadmap locked! Let\'s begin learning.', 'success');
    navigate('quiz');
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
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-guru-500/10 border border-guru-500/20">
            <Route className="w-4 h-4 text-guru-400" />
            <span className="text-sm font-medium text-guru-300">Personalized Learning Path</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-surface-100">Your Learning Roadmap</h2>
          <p className="text-surface-400">This path is ordered by prerequisite dependencies, your diagnostic results, and concept difficulty.</p>
        </div>

        {/* Roadmap items */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-guru-500/50 via-guru-500/20 to-transparent" />

          <div className="space-y-4">
            {sequence.map((conceptId, idx) => {
              const concept = session.concepts[conceptId];
              if (!concept) return null;

              const mastery = concept.masteryScore;
              const hasMisconception = concept.activeMisconceptions.length > 0;
              const isPrereqMet = concept.prerequisites.every(pid => {
                const p = session.concepts[pid];
                return p && p.masteryScore >= 0.4;
              });

              return (
                <div key={conceptId} className="relative pl-14 animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                  {/* Node circle */}
                  <div className={`absolute left-3 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold
                    ${mastery >= 0.7 ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' :
                      mastery > 0 ? 'border-amber-500 bg-amber-500/20 text-amber-300' :
                      'border-surface-600 bg-surface-800 text-surface-400'}`}
                  >
                    {mastery >= 0.7 ? '✓' : idx + 1}
                  </div>

                  {/* Card */}
                  <div className={`bento-card p-4 transition-all duration-200 hover:border-surface-500/30
                    ${!isPrereqMet && concept.prerequisites.length > 0 ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-surface-100">{concept.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-surface-400">
                            {tierEmoji[concept.tier]} {tierLabel[concept.tier]}
                          </span>
                          {hasMisconception && (
                            <span className="badge badge-red flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Misconception
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-surface-400 mt-1">{concept.definition}</p>
                        {!isPrereqMet && concept.prerequisites.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-surface-500">
                            <Lock className="w-3 h-3" />
                            Requires: {concept.prerequisites.map(pid => session.concepts[pid]?.name || pid).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-surface-500">Mastery</div>
                        <div className={`text-lg font-bold ${mastery >= 0.7 ? 'text-emerald-400' : mastery > 0 ? 'text-amber-400' : 'text-surface-500'}`}>
                          {Math.round(mastery * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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
