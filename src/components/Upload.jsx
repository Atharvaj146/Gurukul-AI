import { useState, useRef } from 'react';
import { useSession } from '../context/SessionContext';
import { BookOpen, FileText, Zap, Brain, Target, Star, ChevronDown, Clock, Shield, Book, Upload as UploadIcon, X, ArrowRight } from 'lucide-react';
import { extractTextFromPDF } from '../utils/pdfParser';
import { extractConcepts, generateAllMisconceptions } from '../services/geminiAPI';
import { createSession, getSession, saveSession } from '../services/knowledgeModel';

export default function Upload() {
  const { navigate, notify, setLoading: setGlobalLoading, setError } = useSession();
  const [topic, setTopic] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type === 'application/pdf') setFile(f);
      else notify('Please upload a PDF file', 'error');
    }
  };

  const handleStart = async () => {
    if (!topic.trim()) {
      notify('Please enter a topic name', 'error');
      return;
    }
    /* 
    if (!pastedText.trim() && !file) {
      notify('Please paste notes or upload a PDF', 'error');
      return;
    }
    */

    setLoading(true);
    setGlobalLoading(true);

    try {
      let documentText = pastedText;
      if (file) {
        notify('Extracting text from PDF...', 'info');
        const pdfText = await extractTextFromPDF(file);
        // Truncate for demo speed
        const safePdfText = pdfText.length > 30000 ? pdfText.substring(0, 30000) + "...[TRUNCATED]" : pdfText;
        documentText = documentText ? `${documentText}\n\n${safePdfText}` : safePdfText;
      }

      notify('Analyzing material with AI...', 'info');
      const result = await extractConcepts(topic, documentText);

      if (result.concepts && result.concepts.length > 0) {
        createSession(result.mainTopic || topic, result.concepts, result.dependencies || {});
        notify(`Curriculum ready!`, 'success');
        navigate('diagnostic');

        // Background misconceptions
        generateAllMisconceptions(result.concepts).then(misconceptionsMap => {
          const currentSession = getSession();
          if (currentSession) {
            result.concepts.forEach(concept => {
              if (currentSession.concepts[concept.id] && misconceptionsMap[concept.id]) {
                currentSession.concepts[concept.id].misconceptions = misconceptionsMap[concept.id];
              }
            });
            saveSession(currentSession);
          }
        }).catch(err => console.error("BG Misconceptions failed:", err));

      } else {
        setError('Could not extract concepts. Try more specific text.');
      }
    } catch (err) {
      setError(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const suggestions = ["Quantum Mechanics", "Neural Networks", "Microeconomics", "Cell Biology"];

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-6xl z-10 flex flex-col items-center animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-800/50 border border-surface-700 text-brand-gold text-xs font-medium uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-brand-gold" /> AI Study Companion
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight">
              Master any subject. <br />
              <span className="text-brand-gold">Retain it forever.</span>
            </h1>
            <p className="text-lg text-surface-400 leading-relaxed max-w-lg">
              Upload your syllabus or notes. We build a personalized roadmap based on 90 years of cognitive science.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { label: 'Spaced Repetition', icon: Clock },
                { label: 'Misconception Checks', icon: Target },
                { label: 'Bloom\'s Taxonomy', icon: Book },
                { label: 'Active Recall', icon: Zap },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-surface-500">
                  <div className="w-8 h-8 rounded-full bg-surface-800/50 flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card p-8 bg-surface-900/60 backdrop-blur-xl border border-white/5 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-widest">1. Learning Goal</label>
              <input 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input-premium w-full text-lg"
                placeholder="e.g. Artificial Neural Networks"
              />
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => (
                  <button key={s} onClick={() => setTopic(s)} className="text-[10px] px-2 py-1 rounded-full bg-surface-800 border border-surface-700 text-surface-500 hover:text-brand-gold">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer
                  ${file ? 'border-brand-gold bg-brand-gold/5' : 'border-surface-700 hover:border-surface-500 bg-surface-800/30'}
                  ${dragActive ? 'border-brand-gold bg-brand-gold/10' : ''}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0])} className="hidden" />
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${file ? 'bg-brand-gold/20' : 'bg-surface-700'}`}>
                  {file ? <CheckCircleIcon /> : <UploadIcon className="w-5 h-5 text-surface-400" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{file ? file.name.substring(0, 15) + '...' : 'Upload PDF'}</p>
                  {file && <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-[10px] text-red-400 hover:underline">Remove</button>}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-800/30 border border-surface-700 flex flex-col gap-2 group focus-within:border-brand-gold/50 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-surface-400 flex items-center gap-2"><FileText className="w-3 h-3" /> Paste Notes</p>
                  {!pastedText && (
                    <button 
                      onClick={() => setPastedText("The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration. It has an inner and outer membrane.")}
                      className="text-[9px] text-brand-gold/60 hover:text-brand-gold transition-colors"
                    >
                      Use Sample
                    </button>
                  )}
                </div>
                <textarea 
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full flex-grow bg-transparent text-xs outline-none resize-none placeholder-surface-600 min-h-[80px]"
                  placeholder="Or paste text here..."
                />
              </div>
            </div>

            <button 
              onClick={handleStart}
              disabled={loading || !topic.trim()}
              className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing Topic...' : (
                <>
                  {(!pastedText.trim() && !file) ? 'Start with AI Knowledge' : 'Start Learning'} 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-6 h-6 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}
