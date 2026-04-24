/**
 * Dashboard.jsx — Progress stats, calibration score, mastery breakdown, knowledge graph
 */
import { useState, useEffect } from 'react';
import { BarChart3, Brain, Zap, Target, Clock, BookOpen, TrendingUp, RotateCcw, ChevronRight, AlertTriangle } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { getSession, getConceptStats, getOverdueConcepts, clearSession } from '../services/knowledgeModel';
import KnowledgeGraph from './KnowledgeGraph';

export default function Dashboard() {
  const { navigate, notify } = useSession();
  const [session, setLocalSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('session-updated', handler);
    return () => window.removeEventListener('session-updated', handler);
  }, []);

  function refresh() {
    const s = getSession();
    setLocalSession(s);
    if (s) {
      setStats(getConceptStats(s));
      setOverdue(getOverdueConcepts(s));
    }
  }

  function handleReset() {
    if (confirm('Are you sure? This will clear all your progress.')) {
      clearSession();
      navigate('upload');
    }
  }

  if (!session || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-surface-400">No active study session</p>
          <button onClick={() => navigate('upload')} className="btn-primary">Start Learning</button>
        </div>
      </div>
    );
  }

  const calibration = Math.round((session.student.calibrationScore || 0) * 100);
  const totalQ = session.student.totalQuestionsAnswered || 0;
  const totalCorrect = session.student.totalCorrectAnswers || 0;
  const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

  // Mastery distribution for the bar
  const masteryPct = {
    mastered: stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0,
    learning: stats.total > 0 ? (stats.learning / stats.total) * 100 : 0,
    weak: stats.total > 0 ? (stats.weak / stats.total) * 100 : 0,
    notStarted: stats.total > 0 ? (stats.notStarted / stats.total) * 100 : 0,
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-100">Dashboard</h1>
            <p className="text-surface-400 text-sm">{session.mainTopic}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('quiz')} className="btn-primary flex items-center gap-2" id="continue-quiz-btn">
              <Zap className="w-4 h-4" /> Continue Quiz
            </button>
            <button onClick={handleReset} className="btn-ghost text-surface-500 hover:text-red-400" id="reset-btn">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div className="bento-card p-4 border-amber-500/20 bg-amber-500/5 flex items-center justify-between animate-slide-down">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-amber-300 font-medium">{overdue.length} concept{overdue.length > 1 ? 's' : ''} due for review</span>
              <span className="text-surface-500 text-sm">— your memory is fading!</span>
            </div>
            <button onClick={() => navigate('quiz')} className="text-sm text-amber-400 hover:text-amber-300 font-medium">
              Review Now →
            </button>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Concepts', value: stats.total, icon: BookOpen, color: 'text-guru-400' },
            { label: 'Questions Answered', value: totalQ, icon: Target, color: 'text-violet-400' },
            { label: 'Accuracy', value: `${accuracy}%`, icon: TrendingUp, color: accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Calibration', value: `${calibration}%`, icon: Brain, color: calibration >= 70 ? 'text-emerald-400' : calibration >= 50 ? 'text-amber-400' : 'text-red-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bento-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-surface-500 uppercase tracking-wider">{label}</span>
              </div>
              <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Mastery distribution bar */}
        <div className="bento-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-surface-300">Mastery Distribution</h3>
          <div className="w-full h-4 bg-surface-800 rounded-full overflow-hidden flex">
            {masteryPct.mastered > 0 && <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${masteryPct.mastered}%` }} />}
            {masteryPct.learning > 0 && <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${masteryPct.learning}%` }} />}
            {masteryPct.weak > 0 && <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${masteryPct.weak}%` }} />}
            {masteryPct.notStarted > 0 && <div className="h-full bg-surface-600 transition-all duration-500" style={{ width: `${masteryPct.notStarted}%` }} />}
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Mastered ({stats.mastered})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Learning ({stats.learning})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Weak ({stats.weak})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-surface-600" /> Not started ({stats.notStarted})</span>
          </div>
        </div>

        {/* Knowledge Graph */}
        <KnowledgeGraph onNodeClick={(id) => { navigate('quiz'); }} />

        {/* Calibration insight */}
        {totalQ >= 5 && (
          <div className="bento-card p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-guru-400" />
              <h3 className="font-semibold text-surface-100">Confidence Calibration</h3>
            </div>
            <p className="text-sm text-surface-400">
              {calibration >= 75
                ? '🎯 Excellent calibration! You know what you know and what you don\'t.'
                : calibration >= 50
                ? '📊 Decent calibration. You sometimes overestimate or underestimate your knowledge.'
                : '⚠️ Low calibration — you may be overconfident in some topics. The system is adjusting.'}
            </p>
            <p className="text-xs text-surface-500">
              Calibration = how accurately your confidence predicts your actual performance. Score based on last 20 answers.
            </p>
          </div>
        )}

        {/* Concept list */}
        <div className="bento-card p-5 space-y-4">
          <h3 className="font-semibold text-surface-100">All Concepts</h3>
          <div className="grid gap-2">
            {Object.values(session.concepts)
              .sort((a, b) => b.masteryScore - a.masteryScore)
              .map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 hover:bg-surface-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      c.masteryScore >= 0.7 ? 'bg-emerald-500' :
                      c.masteryScore >= 0.4 ? 'bg-amber-500' :
                      c.masteryScore > 0 ? 'bg-red-500' : 'bg-surface-600'
                    }`} />
                    <span className="text-sm text-surface-200">{c.name}</span>
                    {c.activeMisconceptions.length > 0 && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-surface-500">
                    <span>L{c.bloomsLevelAchieved}</span>
                    <span>{Math.round(c.masteryScore * 100)}%</span>
                    <span>{c.totalAnswered}Q</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
