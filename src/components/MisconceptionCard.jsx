/**
 * MisconceptionCard.jsx — Feedback card after answer submission
 * Green for correct, red for misconception detected
 */
import { CheckCircle2, XCircle, AlertTriangle, ChevronRight, BarChart3, TrendingUp, CalendarPlus, Sparkles } from 'lucide-react';
import { generateICS } from '../utils/calendar';
import { useEffect } from 'react';
import { getSession } from '../services/knowledgeModel';

const BLOOM_LABELS = { 1: 'Remember', 2: 'Understand', 3: 'Apply', 4: 'Analyze', 5: 'Evaluate', 6: 'Create' };

export default function MisconceptionCard({ feedback, concept, bloomLevel, onNext, onDashboard }) {
  if (!feedback) return null;

  const isCorrect = feedback.isCorrect;
  const session = getSession();
  const updatedConcept = session?.concepts[concept.id] || concept;
  const isMastered = updatedConcept.teachingStatus === 'confirmed';

  useEffect(() => {
    if (isMastered) {
      // Auto-schedule review on mastery
      generateICS(concept.name, Date.now() + (updatedConcept.halfLifeDays || 1) * 24 * 60 * 60 * 1000);
    }
  }, [isMastered, concept.name, updatedConcept.halfLifeDays]);

  return (
    <div className="space-y-4 animate-scale-in">
      {/* Result Card */}
      <div className={`bento-card p-6 sm:p-8 border-2 ${isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
        
        {isMastered && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-guru-500/20 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <div>
                <h4 className="font-bold text-emerald-300">Concept Mastered!</h4>
                <p className="text-sm text-surface-300">You've successfully learned {concept.name}. A calendar invite has been downloaded to schedule your first spaced repetition review.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div>
            <h3 className={`text-xl font-display font-bold ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </h3>
            <p className="text-surface-400 text-sm mt-1">{feedback.encouragement}</p>
          </div>
        </div>

        {/* Feedback text */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-800/50">
            <p className="text-surface-200 leading-relaxed">{feedback.feedback}</p>
          </div>

          {/* Misconception detail */}
          {feedback.misconceptionDetected && feedback.misconceptionName && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h4 className="font-semibold text-red-300">Misconception Detected</h4>
              </div>
              <p className="text-sm font-medium text-red-200">{feedback.misconceptionName}</p>
              <p className="text-sm text-surface-400">{feedback.misconceptionExplanation}</p>
            </div>
          )}

          {/* Correct explanation */}
          {!isCorrect && feedback.correctExplanation && (
            <div className="p-4 rounded-xl bg-guru-500/5 border border-guru-500/15 space-y-2">
              <h4 className="font-semibold text-guru-300">✅ Correct Answer</h4>
              <p className="text-sm text-surface-300">{feedback.correctExplanation}</p>
            </div>
          )}

          {/* Bloom's level achieved */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-surface-500" />
              <span className="text-sm text-surface-400">Bloom's Level:</span>
              <span className="badge badge-blue">{BLOOM_LABELS[feedback.bloomsLevelAchieved] || 'N/A'} (L{feedback.bloomsLevelAchieved})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-surface-400">Score:</span>
              <span className={`text-sm font-bold ${(feedback.score || 0) >= 0.7 ? 'text-emerald-400' : (feedback.score || 0) >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                {Math.round((feedback.score || 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        {isCorrect && (
          <button 
            onClick={() => generateICS(concept.name, Date.now() + (concept.halfLifeDays || 1) * 24 * 60 * 60 * 1000)} 
            className="btn-icon flex items-center gap-2 px-4"
            title="Schedule next review"
          >
            <CalendarPlus className="w-4 h-4 text-card-purple" />
            <span className="text-sm">Schedule Review</span>
          </button>
        )}
        <button onClick={onDashboard} className="btn-secondary flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Dashboard
        </button>
        <button onClick={onNext} className="btn-primary flex items-center gap-2" id="next-question-btn">
          Next Question <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
