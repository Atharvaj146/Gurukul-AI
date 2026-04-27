import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { ChevronLeft, ChevronRight, BookOpen, Brain, ExternalLink } from 'lucide-react';
import { papers } from '../data/papers';

export default function Onboarding() {
  const { navigate } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    if (currentIndex < papers.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      navigate('upload');
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const paper = papers[currentIndex];

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 flex flex-col items-center animate-slide-up">
        
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-800/50 border border-surface-700 text-brand-gold text-xs font-medium uppercase tracking-wider mb-2">
            <Brain className="w-4 h-4" /> The Science of Learning
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Built on 14 Foundational Research Papers</h1>
          <p className="text-surface-400 max-w-2xl text-sm">
            Before you start learning, see the cognitive science that powers our engine.
          </p>
        </div>

        {/* Carousel Card */}
        <div className="w-full bento-card p-8 bg-surface-900/80 backdrop-blur-xl border border-brand-gold/20 shadow-2xl relative min-h-[350px] flex flex-col justify-between">
          
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-widest">
              Paper {currentIndex + 1} of {papers.length}
            </span>
            <span className="text-xs font-medium text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full">
              {paper.category}
            </span>
          </div>

          <div className="space-y-4 flex-1">
            <h2 className="text-2xl font-bold text-surface-100">{paper.title}</h2>
            <p className="text-sm font-medium text-surface-400 pb-4 border-b border-surface-800/50">
              {paper.authorLine}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-brand-gold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> The Finding
                </h3>
                <p className="text-sm text-surface-300 leading-relaxed">
                  {paper.description}
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <Brain className="w-4 h-4" /> How Gurukul AI Uses It
                </h3>
                <p className="text-sm text-surface-300 leading-relaxed">
                  {paper.implementation}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6 pt-4 border-t border-surface-800/50">
            {paper.links.map((link, idx) => (
              <a 
                key={idx} 
                href={link.url} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-medium text-surface-400 hover:text-brand-gold transition-colors flex items-center gap-1"
              >
                {link.text} <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between w-full mt-8">
          <button 
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="btn-ghost flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>
          
          {/* Progress dots */}
          <div className="flex gap-1.5 hidden sm:flex">
            {papers.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-6 bg-brand-gold' : 'w-1.5 bg-surface-700'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={nextSlide}
            className="btn-primary flex items-center gap-2"
          >
            {currentIndex === papers.length - 1 ? 'Start Learning' : 'Next Paper'} 
            {currentIndex !== papers.length - 1 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

      </div>
    </div>
  );
}
