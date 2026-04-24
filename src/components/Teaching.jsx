/**
 * Teaching.jsx — Step 6: Teach concepts BEFORE quizzing
 * 4-part teaching experience: Worked Example → Explanation → Analogy → Quick Checks
 */
import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, Puzzle, CheckCircle2, ChevronRight, Loader2, Brain, Send, Sparkles, ArrowRight } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { getSession, updateConcept } from '../services/knowledgeModel';
import { generateTeachingContent } from '../services/geminiAPI';

const PART_ICONS = {
  partA: BookOpen,
  partB: Brain,
  partC: Lightbulb,
  partD: Puzzle,
};

const PART_COLORS = {
  partA: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-300', icon: 'text-violet-400', accent: 'bg-violet-500' },
  partB: { bg: 'bg-guru-500/10', border: 'border-guru-500/20', text: 'text-guru-300', icon: 'text-guru-400', accent: 'bg-guru-500' },
  partC: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300', icon: 'text-amber-400', accent: 'bg-amber-500' },
  partD: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300', icon: 'text-emerald-400', accent: 'bg-emerald-500' },
};

export default function Teaching() {
  const { navigate, notify, setError } = useSession();
  const [session, setLocalSession] = useState(null);
  const [concept, setConcept] = useState(null);
  const [content, setContent] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | teaching
  const [currentPart, setCurrentPart] = useState(0); // 0=partA, 1=partB, 2=partC, 3=partD
  const [microCheckAnswers, setMicroCheckAnswers] = useState({});
  const [microCheckRevealed, setMicroCheckRevealed] = useState({});
  const [allPartsRead, setAllPartsRead] = useState(false);

  useEffect(() => {
    loadTeachingContent();
  }, []);

  async function loadTeachingContent() {
    setPhase('loading');
    const s = getSession();
    setLocalSession(s);
    if (!s) return;

    // Find the current concept from roadmap
    const idx = s.roadmap.currentIndex || 0;
    const conceptId = s.roadmap.sequence[idx];
    if (!conceptId || !s.concepts[conceptId]) {
      // All concepts done
      navigate('dashboard');
      return;
    }

    const currentConcept = s.concepts[conceptId];
    setConcept(currentConcept);

    // Find best known concept for analogy
    const bestId = s.student.bestKnownConceptId;
    const bestConcept = bestId && s.concepts[bestId] ? s.concepts[bestId] : null;

    try {
      const studentLevel = s.student.diagnosticLevel || 'beginner';
      const teachingContent = await generateTeachingContent(currentConcept, studentLevel, bestConcept);
      setContent(teachingContent);

      // Mark concept as in-progress
      updateConcept(conceptId, { teachingStatus: 'in_progress' });

      setPhase('teaching');
    } catch (err) {
      setError(`Failed to generate teaching content: ${err.message}`);
    }
  }

  function handleMicroCheckSubmit(partKey, checkIdx) {
    setMicroCheckRevealed(prev => ({ ...prev, [`${partKey}-${checkIdx}`]: true }));
  }

  function handleNextPart() {
    if (currentPart < 3) {
      setCurrentPart(currentPart + 1);
    } else {
      setAllPartsRead(true);
    }
  }

  function handleProceedToQuiz() {
    // Mark concept as taught
    if (concept) {
      updateConcept(concept.id, { teachingStatus: 'taught', workedExampleSeen: true });
    }
    notify('Great! Now let\'s check your understanding.', 'success');
    navigate('quiz');
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <BookOpen className="w-12 h-12 text-guru-400 animate-pulse mx-auto" />
          <p className="text-surface-300 text-lg">Preparing your lesson...</p>
          <p className="text-surface-500 text-sm">Building a personalized explanation with analogies</p>
        </div>
      </div>
    );
  }

  if (!content || !concept) return null;

  const parts = [
    { key: 'partA', data: content.partA, label: 'Worked Example' },
    { key: 'partB', data: content.partB, label: 'Core Explanation' },
    { key: 'partC', data: content.partC, label: 'Analogy' },
    { key: 'partD', data: content.partD, label: 'Quick Checks' },
  ];

  const currentPartData = parts[currentPart];
  const colors = PART_COLORS[currentPartData.key];
  const Icon = PART_ICONS[currentPartData.key];
  const progress = ((currentPart + 1) / 4) * 100;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-guru-500/10 border border-guru-500/20 text-xs font-semibold text-guru-300 uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                Learning Mode
              </div>
              <h2 className="text-2xl font-display font-bold text-surface-100">{concept.name}</h2>
              <p className="text-surface-400 text-sm mt-1">{concept.definition}</p>
            </div>
            <div className="text-right">
              <span className={`badge ${colors.bg} ${colors.border} ${colors.text} border`}>
                Part {currentPart + 1}/4
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-guru-600 to-guru-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Part navigation tabs */}
          <div className="flex gap-2">
            {parts.map((p, idx) => {
              const pColor = PART_COLORS[p.key];
              const PIcon = PART_ICONS[p.key];
              return (
                <button
                  key={p.key}
                  onClick={() => idx <= currentPart && setCurrentPart(idx)}
                  disabled={idx > currentPart}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                    idx === currentPart
                      ? `${pColor.bg} ${pColor.text} border ${pColor.border}`
                      : idx < currentPart
                      ? 'bg-surface-800/50 text-surface-400 hover:bg-surface-800'
                      : 'bg-surface-800/20 text-surface-600 cursor-not-allowed'
                  }`}
                >
                  <PIcon className="w-3.5 h-3.5" />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        {!allPartsRead ? (
          <div className={`bento-card p-6 sm:p-8 border-2 ${colors.border} animate-slide-up`} key={currentPartData.key}>
            {/* Part Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-surface-100">
                  {currentPartData.data?.title || currentPartData.label}
                </h3>
              </div>
            </div>

            {/* Part A, B, C — Text content */}
            {currentPartData.key !== 'partD' && (
              <div className="space-y-4">
                <div className="teaching-prose">
                  {(currentPartData.data?.content || '').split('\n').map((line, i) => (
                    <p key={i} className={line.match(/^(Step \d|#)/) ? 'font-semibold text-surface-100' : ''}>
                      {line}
                    </p>
                  ))}
                </div>

                {/* Diagram description for Part B */}
                {currentPartData.key === 'partB' && currentPartData.data?.diagramDescription && (
                  <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
                    <p className="text-xs uppercase tracking-wider text-surface-500 mb-2">Visual Concept</p>
                    <p className="text-sm text-surface-300 italic">{currentPartData.data.diagramDescription}</p>
                  </div>
                )}

                {/* Micro-check after this part */}
                {content.partD?.microChecks && (() => {
                  const check = content.partD.microChecks.find(mc =>
                    mc.afterSection?.toLowerCase().includes(currentPartData.key === 'partA' ? 'a' : currentPartData.key === 'partB' ? 'b' : 'c')
                  );
                  if (!check) return null;
                  const checkKey = `${currentPartData.key}-0`;
                  return (
                    <div className="mt-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-3">
                      <div className="flex items-center gap-2">
                        <Puzzle className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-300">Quick Check</span>
                      </div>
                      <p className="text-surface-200 text-sm">{check.question}</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={microCheckAnswers[checkKey] || ''}
                          onChange={(e) => setMicroCheckAnswers(prev => ({ ...prev, [checkKey]: e.target.value }))}
                          className="input-premium text-sm flex-1"
                          placeholder="Type your answer..."
                          disabled={microCheckRevealed[checkKey]}
                        />
                        {!microCheckRevealed[checkKey] ? (
                          <button
                            onClick={() => handleMicroCheckSubmit(currentPartData.key, 0)}
                            disabled={!microCheckAnswers[checkKey]?.trim()}
                            className="btn-primary px-4 py-2 text-sm flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" /> Check
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-400 px-3">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      {microCheckRevealed[checkKey] && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/15 animate-scale-in">
                          <p className="text-xs uppercase tracking-wider text-emerald-400 mb-1">Expected Answer</p>
                          <p className="text-sm text-surface-200">{check.expectedAnswer}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Part D — All micro checks summary */}
            {currentPartData.key === 'partD' && content.partD?.microChecks && (
              <div className="space-y-4">
                <p className="text-surface-400 text-sm">Let's make sure everything clicked. Answer these quick retrieval questions:</p>
                {content.partD.microChecks.map((check, idx) => {
                  const checkKey = `partD-${idx}`;
                  return (
                    <div key={idx} className="p-4 rounded-xl bg-surface-800/30 border border-surface-700/50 space-y-3">
                      <p className="text-surface-200 font-medium">{check.question}</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={microCheckAnswers[checkKey] || ''}
                          onChange={(e) => setMicroCheckAnswers(prev => ({ ...prev, [checkKey]: e.target.value }))}
                          className="input-premium text-sm flex-1"
                          placeholder="Your answer..."
                          disabled={microCheckRevealed[checkKey]}
                        />
                        {!microCheckRevealed[checkKey] ? (
                          <button
                            onClick={() => handleMicroCheckSubmit('partD', idx)}
                            disabled={!microCheckAnswers[checkKey]?.trim()}
                            className="btn-primary px-4 py-2 text-sm flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" /> Check
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-400 px-3">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      {microCheckRevealed[checkKey] && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/15 animate-scale-in">
                          <p className="text-xs uppercase tracking-wider text-emerald-400 mb-1">Expected Answer</p>
                          <p className="text-sm text-surface-200">{check.expectedAnswer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Next Part Button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-surface-700/30">
              <button
                onClick={handleNextPart}
                className="btn-primary flex items-center gap-2"
                id="next-part-btn"
              >
                {currentPart < 3 ? (
                  <>Next: {parts[currentPart + 1]?.label} <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>Complete Lesson <CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Lesson Complete Card */
          <div className="bento-card p-8 text-center space-y-6 animate-scale-in border-2 border-emerald-500/20">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-surface-100">Lesson Complete!</h3>
              <p className="text-surface-400 mt-2">
                You've learned about <span className="text-surface-200 font-medium">{concept.name}</span>.
                Now let's verify your understanding with Bloom's Taxonomy assessment.
              </p>
            </div>
            <button
              onClick={handleProceedToQuiz}
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg"
              id="proceed-to-quiz-btn"
            >
              <Brain className="w-5 h-5" />
              Test My Understanding
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
