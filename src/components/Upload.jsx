import { useState, useRef } from 'react';
import { Upload as UploadIcon, FileText, Sparkles, BookOpen, Brain, Zap, X, ArrowRight } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { extractTextFromPDF } from '../utils/pdfParser';
import { extractConcepts } from '../services/geminiAPI';
import { createSession } from '../services/knowledgeModel';

import Science from './Science';

export default function Upload() {
  const { navigate, setLoading, setError, notify, loading } = useSession();
  const [topic, setTopic] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
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

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    // Reset the file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCardClick = () => {
    // Only open file picker if no file is currently selected
    if (!file) {
      fileInputRef.current?.click();
    }
  };

  const handleStart = async () => {
    if (!topic.trim()) {
      notify('Please enter what you want to learn', 'error');
      return;
    }

    setExtracting(true);
    setLoading(true);

    try {
      let documentText = pastedText;
      if (file) {
        notify('Extracting text from PDF...', 'info');
        const pdfText = await extractTextFromPDF(file);
        documentText = documentText ? `${documentText}\n\n${pdfText}` : pdfText;
      }

      notify('Analyzing material...', 'info');
      const result = await extractConcepts(topic, documentText);

      if (result.concepts && result.concepts.length > 0) {
        createSession(result.mainTopic || topic, result.concepts, result.dependencies || {});
        notify(`Found ${result.concepts.length} concepts!`, 'success');
        navigate('diagnostic');
      } else {
        setError('Could not extract concepts. Try a more specific topic or add notes.');
      }
    } catch (err) {
      setError(`Failed to extract concepts: ${err.message}`);
    } finally {
      setExtracting(false);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-brand-navy flex flex-col justify-center items-center p-6 md:p-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-brand-gold/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#050B16] blur-[80px] pointer-events-none" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center animate-fade-in relative z-10">
        
        {/* Left Column: Typography & Copy */}
        <div className="space-y-8">
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-brand-gold animate-pulse shadow-[0_0_15px_rgba(232,139,35,0.8)]" />
              <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-[0.2em] uppercase">
                Gurukul <span className="text-brand-gold">AI</span>
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-navyDark/50 border border-brand-gold/20 text-xs font-semibold uppercase tracking-widest text-blue-200/80 shadow-lg">
              Next-Gen Learning Platform
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl heading-display text-white leading-[1.1]">
            Master any subject. <br />
            <span className="text-brand-gold drop-shadow-md">Retain it forever.</span>
          </h1>
          
          <p className="text-lg text-blue-100/70 max-w-lg leading-relaxed">
            Upload your syllabus, lecture notes, or textbooks. We build a personalized learning roadmap based on 90 years of cognitive science—not just a generic chat.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <div className="w-8 h-8 rounded-full bg-card-purple flex items-center justify-center text-card-purpleText">
                <Brain className="w-4 h-4" />
              </div>
              Spaced Repetition
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <div className="w-8 h-8 rounded-full bg-card-blue flex items-center justify-center text-card-blueText">
                <TargetIcon />
              </div>
              Misconception Checks
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <div className="w-8 h-8 rounded-full bg-card-yellow flex items-center justify-center text-card-yellowText">
                <BookOpen className="w-4 h-4" />
              </div>
              Bloom's Taxonomy
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              Active Recall
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <Sparkles className="w-4 h-4" />
              </div>
              Feynman Technique
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              Socratic Questioning
            </div>
          </div>
        </div>

        {/* Right Column: Bento Grid for Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Main Topic Input Card (Spans full width) */}
          <div className="bento-card col-span-1 md:col-span-2 p-6 md:p-8 space-y-4">
            <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wider">What are we studying?</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Artificial Neural Networks"
              className="input-premium text-lg w-full"
              disabled={extracting}
            />
          </div>

          {/* PDF Upload Card (Colored) */}
          <div 
            className={`bento-card col-span-1 p-6 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all duration-200
              ${file ? 'card-green' : 'card-purple'}
              ${dragActive ? 'scale-[1.02] shadow-xl' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleCardClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <>
                <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-xs opacity-70 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                {/* Remove button */}
                <button
                  onClick={handleRemoveFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/15 hover:bg-black/25 text-sm font-medium transition-colors"
                  id="remove-pdf-btn"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center">
                  <UploadIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">Upload PDF</p>
                  <p className="text-xs opacity-70 mt-1">Lecture slides, textbooks</p>
                </div>
              </>
            )}
          </div>

          {/* Paste Text Card */}
          <div className="bento-card card-blue col-span-1 p-6 flex flex-col justify-between gap-4">
            <div>
              <p className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" /> Paste Notes
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Or paste syllabus here..."
                rows={3}
                className="w-full mt-3 bg-black/5 rounded-xl p-3 text-sm placeholder-current/50 outline-none resize-none"
                disabled={extracting}
              />
            </div>
          </div>

          {/* Action Button (Spans full width) */}
          <div className="col-span-1 md:col-span-2 pt-2">
            <button
              onClick={handleStart}
              disabled={!topic.trim() || extracting}
              className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3"
            >
              {extracting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building curriculum...
                </>
              ) : (
                <>
                  Start Learning <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
      </div>
      <Science />
    </>
  );
}

function TargetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  )
}
