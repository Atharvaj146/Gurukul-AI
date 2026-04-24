import { useState } from 'react';
import { papers } from '../data/papers';

const CATEGORY_COLORS = {
  'Memory & retention': 'bg-purple-100 text-purple-800 border-purple-200',
  'Assessment': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Cognition & load': 'bg-orange-100 text-orange-800 border-orange-200',
  'Motivation': 'bg-blue-100 text-blue-800 border-blue-200',
  'Metacognition': 'bg-amber-100 text-amber-800 border-amber-200',
};

const CATEGORIES = [
  'All papers',
  'Memory & retention',
  'Assessment',
  'Cognition & load',
  'Motivation',
  'Metacognition'
];

export default function Science() {
  const [activeFilter, setActiveFilter] = useState('All papers');

  const filteredPapers = activeFilter === 'All papers' 
    ? papers 
    : papers.filter(p => p.category === activeFilter);

  return (
    <section className="bg-white text-gray-900 py-24 px-6 md:px-12 w-full">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header Area */}
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold uppercase tracking-widest text-gray-600">
            Peer-reviewed research
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            The science behind Gurukul AI
          </h2>
          
          <p className="text-lg text-gray-600 leading-relaxed">
            Every feature in Gurukul AI is built on published research. Not intuition, not guesswork — actual cognitive science that has been tested, replicated, and proven over decades.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-gray-200 py-8">
          <div>
            <div className="text-3xl font-bold text-gray-900">14</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Research papers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">90+</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Years of research</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">40–50%</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Exam score improvement</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">0.7</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Max effect size</div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="space-y-4">
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Filter by category</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  activeFilter === category
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Papers Grid */}
        <div className="space-y-8">
          {filteredPapers.map(paper => (
            <div key={paper.id} className="border border-gray-200 rounded-2xl p-6 md:p-8 bg-white flex flex-col md:flex-row gap-6 md:gap-12 items-start">
              
              {/* Left col: ID & Category */}
              <div className="w-full md:w-1/4 shrink-0 space-y-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold border ${CATEGORY_COLORS[paper.category]}`}>
                  {paper.id}
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[paper.category]}`}>
                    {paper.category}
                  </span>
                </div>
              </div>

              {/* Right col: Content */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                    {paper.title}
                  </h3>
                  <p className="text-sm font-medium text-gray-500">
                    {paper.authorLine}
                  </p>
                </div>

                <p className="text-gray-700 leading-relaxed text-base">
                  {paper.description}
                </p>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    How we use this
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {paper.implementation}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {paper.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                    >
                      {link.text} ↗
                    </a>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
