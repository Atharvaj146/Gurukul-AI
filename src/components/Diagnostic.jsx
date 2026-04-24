/**
 * Diagnostic.jsx — Step 3: MCQ + Open-ended diagnostic assessment
 */
import { useState, useEffect } from 'react';
import { ClipboardCheck, ChevronRight, Brain, MessageSquare, Loader2 } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { generateDiagnosticQuestions, analyzeDiagnosticResults } from '../services/geminiAPI';
import { getSession, setDiagnosticResults } from '../services/knowledgeModel';

export default function Diagnostic() {
  const { navigate, notify, setError } = useSession();
  const [phase, setPhase] = useState('loading'); // loading | mcq | open-ended | analyzing
  const [questions, setQuestions] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState([]);
  const [openAnswers, setOpenAnswers] = useState(['', '']);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      const session = getSession();
      if (!session) return;
      const concepts = Object.values(session.concepts);
      const result = await generateDiagnosticQuestions(concepts, session.mainTopic);
      setQuestions(result);
      setPhase('mcq');
    } catch (err) {
      setError(`Failed to generate diagnostic: ${err.message}`);
    }
  }

  function handleMCQAnswer() {
    if (selectedOption === null) return;
    const q = questions.mcqQuestions[currentQ];
    mcqAnswers.push({ questionId: q.id, conceptId: q.conceptId, selectedIndex: selectedOption, correct: selectedOption === q.correctIndex });
    setMcqAnswers([...mcqAnswers]);
    setSelectedOption(null);

    if (currentQ + 1 < questions.mcqQuestions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      setCurrentQ(0);
      setPhase('open-ended');
    }
  }

  async function handleSubmitDiagnostic() {
    if (!openAnswers[0].trim() || !openAnswers[1].trim()) {
      notify('Please answer both questions', 'error');
      return;
    }

    setPhase('analyzing');
    try {
      const session = getSession();
      const concepts = Object.values(session.concepts);
      const result = await analyzeDiagnosticResults(
        mcqAnswers,
        openAnswers.map((a, i) => ({ questionId: questions.openEndedQuestions[i].id, answer: a })),
        concepts
      );
      setDiagnosticResults(result);
      notify('Diagnostic complete!', 'success');
      navigate('gap-analysis');
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
      setPhase('open-ended');
    }
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <Loader2 className="w-12 h-12 text-guru-400 animate-spin mx-auto" />
          <p className="text-surface-300 text-lg">Preparing your diagnostic assessment...</p>
          <p className="text-surface-500 text-sm">This helps us understand what you already know</p>
        </div>
      </div>
    );
  }

  if (phase === 'analyzing') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <Brain className="w-12 h-12 text-guru-400 animate-pulse mx-auto" />
          <p className="text-surface-300 text-lg">Analyzing your knowledge gaps...</p>
          <p className="text-surface-500 text-sm">Detecting misconceptions and mapping your understanding</p>
        </div>
      </div>
    );
  }

  if (phase === 'mcq' && questions) {
    const q = questions.mcqQuestions[currentQ];
    const progress = ((currentQ) / questions.mcqQuestions.length) * 100;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full space-y-6 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-guru-400" />
              <h2 className="text-xl font-display font-semibold text-surface-100">Diagnostic Assessment</h2>
            </div>
            <span className="badge badge-blue">Phase 1: MCQ</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-guru-600 to-guru-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Question Card */}
          <div className="bento-card p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-guru-500/20 flex items-center justify-center text-sm font-bold text-guru-300">
                {currentQ + 1}
              </span>
              <p className="text-lg text-surface-100 font-medium leading-relaxed">{q.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedOption === idx
                      ? 'border-guru-500 bg-guru-500/10 text-surface-100'
                      : 'border-surface-700/50 bg-surface-800/30 text-surface-300 hover:border-surface-600 hover:bg-surface-800/50'
                  }`}
                  id={`option-${idx}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-surface-500">Question {currentQ + 1} of {questions.mcqQuestions.length}</span>
              <button onClick={handleMCQAnswer} disabled={selectedOption === null} className="btn-primary flex items-center gap-2" id="next-question-btn">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'open-ended' && questions) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-violet-400" />
              <h2 className="text-xl font-display font-semibold text-surface-100">Open-Ended Questions</h2>
            </div>
            <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>Phase 2: Free Response</span>
          </div>

          <div className="bento-card p-6 sm:p-8 space-y-8">
            {questions.openEndedQuestions.map((q, idx) => (
              <div key={q.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-300">
                    {idx + 1}
                  </span>
                  <p className="text-surface-100 font-medium leading-relaxed">{q.question}</p>
                </div>
                <textarea
                  value={openAnswers[idx]}
                  onChange={(e) => { const a = [...openAnswers]; a[idx] = e.target.value; setOpenAnswers(a); }}
                  rows={5}
                  className="input-premium resize-none ml-11"
                  placeholder="Write your answer here... Don't look anything up."
                  id={`open-answer-${idx}`}
                />
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button onClick={handleSubmitDiagnostic} disabled={!openAnswers[0].trim() || !openAnswers[1].trim()} className="btn-primary flex items-center gap-2" id="submit-diagnostic-btn">
                <Brain className="w-4 h-4" /> Analyze My Knowledge
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
