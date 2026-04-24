/**
 * QuizCard.jsx — Step 7: Adaptive quiz with confidence selector + misconception detection
 */
import { useState, useEffect } from 'react';
import { Zap, Brain, Send, Lightbulb, ChevronRight, BarChart3, BookOpen, ArrowLeft } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { getSession, recordAnswer, updateConcept, updateRoadmap, getConceptStats } from '../services/knowledgeModel';
import { generateQuizQuestion, evaluateAnswer } from '../services/geminiAPI';
import { pickNextConcept, getTargetBloomLevel, getZPDFallbackLevel, isConceptConfirmed } from '../services/questionScheduler';
import MisconceptionCard from './MisconceptionCard';

const CONFIDENCE_LEVELS = [
  { value: 1, label: 'No Idea', color: 'border-red-500/50 bg-red-500/10 text-red-300', activeColor: 'border-red-500 bg-red-500/20 text-red-200 shadow-red-500/20' },
  { value: 2, label: 'Unsure', color: 'border-amber-500/50 bg-amber-500/10 text-amber-300', activeColor: 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-amber-500/20' },
  { value: 3, label: 'Maybe', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300', activeColor: 'border-yellow-500 bg-yellow-500/20 text-yellow-200 shadow-yellow-500/20' },
  { value: 4, label: 'Confident', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300', activeColor: 'border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-emerald-500/20' },
  { value: 5, label: 'Very Sure', color: 'border-guru-500/50 bg-guru-500/10 text-guru-300', activeColor: 'border-guru-500 bg-guru-500/20 text-guru-200 shadow-guru-500/20' },
];

const BLOOM_LABELS = { 1: 'Remember', 2: 'Understand', 3: 'Apply', 4: 'Analyze', 5: 'Evaluate', 6: 'Create' };

export default function QuizCard() {
  const { navigate, notify } = useSession();
  const [session, setLocalSession] = useState(null);
  const [currentConcept, setCurrentConcept] = useState(null);
  const [reason, setReason] = useState('');
  const [question, setQuestion] = useState(null);
  const [bloomLevel, setBloomLevel] = useState(3);
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | question | submitted | feedback
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => { loadNextQuestion(); }, []);

  async function loadNextQuestion() {
    setPhase('loading');
    setAnswer('');
    setConfidence(null);
    setShowHint(false);
    setFeedback(null);

    const s = getSession();
    setLocalSession(s);
    if (!s) return;

    const pick = pickNextConcept(s);
    if (!pick) { navigate('dashboard'); return; }

    setCurrentConcept(pick.concept);
    setReason(pick.reason);

    const bl = getTargetBloomLevel(pick.concept);
    setBloomLevel(bl);

    try {
      const q = await generateQuizQuestion(pick.concept, bl);
      setQuestion(q);
      setPhase('question');
    } catch (err) {
      notify(`Failed to generate question: ${err.message}`, 'error');
    }
  }

  async function handleSubmit() {
    if (!answer.trim() || confidence === null) {
      notify('Please select your confidence and write an answer', 'error');
      return;
    }

    setPhase('submitted');
    try {
      const result = await evaluateAnswer(question.question, question.expectedAnswer, answer, currentConcept);
      setFeedback(result);

      // Record the answer
      const misconception = result.misconceptionDetected ? { name: result.misconceptionName, description: result.misconceptionExplanation } : null;
      recordAnswer(currentConcept.id, confidence, result.isCorrect, result.bloomsLevelAchieved || bloomLevel, misconception);

      // Update ZPD if correct
      if (result.isCorrect) {
        updateConcept(currentConcept.id, { zpd: bloomLevel });
        // Check if concept is now confirmed
        const updated = getSession();
        const concept = updated.concepts[currentConcept.id];
        if (isConceptConfirmed(concept)) {
          updateConcept(currentConcept.id, { teachingStatus: 'confirmed', masteryScore: 0.8 });
          // Advance roadmap
          if (updated.roadmap.currentIndex < updated.roadmap.sequence.length) {
            updateRoadmap({ currentIndex: updated.roadmap.currentIndex + 1 });
          }
        }
      }

      setPhase('feedback');
    } catch (err) {
      notify(`Failed to evaluate answer: ${err.message}`, 'error');
      setPhase('question');
    }
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <Zap className="w-12 h-12 text-guru-400 animate-pulse mx-auto" />
          <p className="text-surface-300 text-lg">Preparing your next question...</p>
        </div>
      </div>
    );
  }

  const stats = getConceptStats(getSession());

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('dashboard')} className="btn-ghost flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-3">
            <span className="badge badge-green">{stats.mastered} mastered</span>
            <span className="badge badge-yellow">{stats.learning} learning</span>
            <span className="badge badge-red">{stats.weak} weak</span>
          </div>
        </div>

        {phase === 'feedback' && feedback ? (
          <MisconceptionCard
            feedback={feedback}
            concept={currentConcept}
            bloomLevel={bloomLevel}
            onNext={loadNextQuestion}
            onDashboard={() => navigate('dashboard')}
          />
        ) : (
          <div className="space-y-6 animate-slide-up">
            {/* Concept header */}
            <div className="bento-card p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider">Now studying</p>
                <h3 className="text-lg font-display font-semibold text-surface-100">{currentConcept?.name}</h3>
                <p className="text-sm text-guru-400">{reason}</p>
              </div>
              <div className="text-right">
                <div className="badge badge-blue">{BLOOM_LABELS[bloomLevel]} (L{bloomLevel})</div>
                <p className="text-xs text-surface-500 mt-1">
                  Mastery: {Math.round((currentConcept?.masteryScore || 0) * 100)}%
                </p>
              </div>
            </div>

            {/* Question */}
            <div className="bento-card p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-guru-500/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-guru-400" />
                </div>
                <p className="text-lg text-surface-100 leading-relaxed pt-1">{question?.question}</p>
              </div>

              {/* Hint */}
              {question?.hint && (
                <div>
                  {showHint ? (
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-sm text-amber-300 animate-scale-in">
                      <span className="font-medium">💡 Hint:</span> {question.hint}
                    </div>
                  ) : (
                    <button onClick={() => setShowHint(true)} className="flex items-center gap-2 text-sm text-surface-500 hover:text-amber-400 transition-colors">
                      <Lightbulb className="w-4 h-4" /> Need a hint?
                    </button>
                  )}
                </div>
              )}

              {/* Confidence selector */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-surface-300">How confident are you?</p>
                <div className="flex flex-wrap gap-2">
                  {CONFIDENCE_LEVELS.map((cl) => (
                    <button
                      key={cl.value}
                      onClick={() => setConfidence(cl.value)}
                      className={`confidence-btn ${confidence === cl.value ? cl.activeColor + ' shadow-lg' : cl.color}`}
                      id={`confidence-${cl.value}`}
                    >
                      {cl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Answer area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-300">Your answer</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={5}
                  className="input-premium resize-none"
                  placeholder="Type your answer here..."
                  disabled={phase === 'submitted'}
                  id="quiz-answer"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || confidence === null || phase === 'submitted'}
                  className="btn-primary flex items-center gap-2"
                  id="submit-answer-btn"
                >
                  {phase === 'submitted' ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Evaluating...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Answer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
