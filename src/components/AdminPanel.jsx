import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Shield, Zap, RotateCcw, Calendar, CheckCircle2, AlertTriangle, Navigation, Brain } from 'lucide-react';
import { getSession, saveSession, clearSession } from '../services/knowledgeModel';
import { generateICS } from '../utils/calendar';

export default function AdminPanel() {
  const { navigate, notify } = useSession();
  const [session, setLocalSession] = useState(getSession());

  // Security check
  if (localStorage.getItem('guru_admin_token') !== 'true') {
    navigate('admin-login');
    return null;
  }

  function refresh() {
    setLocalSession(getSession());
  }

  function simulateFullMastery() {
    const s = getSession();
    if (!s) {
      notify('No active session to master!', 'error');
      return;
    }
    
    Object.values(s.concepts).forEach(c => {
      c.masteryScore = 0.95;
      c.teachingStatus = 'confirmed';
      c.bloomsLevelAchieved = 4;
      c.totalAnswered = 10;
    });
    
    saveSession(s);
    refresh();
    notify('All concepts simulated as Mastered!', 'success');
  }

  function forceOverdue() {
    const s = getSession();
    if (!s || Object.keys(s.concepts).length === 0) {
      notify('Start a session first!', 'error');
      return;
    }
    
    const firstId = Object.keys(s.concepts)[0];
    s.concepts[firstId].nextReviewAt = Date.now() - 10000; // In the past
    s.concepts[firstId].totalAnswered = 1;
    
    saveSession(s);
    refresh();
    notify(`Concept "${s.concepts[firstId].name}" is now overdue for review!`, 'success');
  }

  function handleReset() {
    if (confirm('Wipe all local data?')) {
      clearSession();
      refresh();
      notify('Session cleared.', 'info');
      navigate('upload');
    }
  }

  function testCalendar() {
    generateICS('Admin_Test_Review', Date.now() + 3600000);
    notify('Test calendar file downloaded!', 'success');
  }

  const screens = ['upload', 'roadmap', 'quiz', 'teaching', 'dashboard', 'onboarding'];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <header className="flex items-center gap-4 border-b border-surface-800 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Admin Control Center</h1>
            <p className="text-surface-400">Force system states and bypass learning constraints for testing.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <section className="bento-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-surface-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-gold" /> State Simulation
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={simulateFullMastery} className="admin-btn hover:bg-emerald-500/10 hover:border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Simulate 100% Mastery
              </button>
              <button onClick={forceOverdue} className="admin-btn hover:bg-amber-500/10 hover:border-amber-500/30">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Force Review Alert
              </button>
              <button onClick={testCalendar} className="admin-btn hover:bg-blue-500/10 hover:border-blue-500/30">
                <Calendar className="w-4 h-4 text-blue-400" /> Test Calendar Export
              </button>
              <button onClick={() => navigate('diagnostic')} className="admin-btn hover:bg-fuchsia-500/10 hover:border-fuchsia-500/30">
                <Brain className="w-4 h-4 text-fuchsia-400" /> Force Diagnostic Start
              </button>
              <button onClick={handleReset} className="admin-btn hover:bg-red-500/10 hover:border-red-500/30">
                <RotateCcw className="w-4 h-4 text-red-400" /> Full Data Reset
              </button>
            </div>
          </section>

          {/* Navigation Bypass */}
          <section className="bento-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-surface-100 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-violet-400" /> Navigation Override
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {screens.map(s => (
                <button 
                  key={s} 
                  onClick={() => navigate(s)}
                  className="px-3 py-2 text-xs font-bold rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-white hover:bg-surface-700 capitalize"
                >
                  Jump to {s}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* System Info */}
        <section className="bento-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-surface-100 flex items-center gap-2">
            <Brain className="w-5 h-5 text-guru-400" /> Active Session Diagnostics
          </h2>
          {session ? (
            <div className="space-y-2 text-sm">
              <p className="text-surface-400">Topic: <span className="text-white font-mono">{session.mainTopic}</span></p>
              <p className="text-surface-400">Concepts: <span className="text-white font-mono">{Object.keys(session.concepts).length}</span></p>
              <p className="text-surface-400">Current Step: <span className="text-white font-mono">{session.roadmap.currentIndex + 1} / {session.roadmap.sequence.length}</span></p>
              <div className="pt-4 border-t border-surface-800 mt-4">
                 <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-2">Internal Concept State</p>
                 <div className="max-h-40 overflow-y-auto space-y-1">
                    {Object.values(session.concepts).map(c => (
                      <div key={c.id} className="text-[10px] flex justify-between font-mono bg-black/20 p-1 rounded">
                        <span className="text-surface-400">{c.name}</span>
                        <span className={c.masteryScore > 0.7 ? 'text-emerald-400' : 'text-amber-400'}>
                          M:{(c.masteryScore * 100).toFixed(0)}% | L:{c.bloomsLevelAchieved} | {c.teachingStatus}
                        </span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ) : (
            <p className="text-surface-500 italic">No active session found in localStorage.</p>
          )}
        </section>
      </div>
      
      <style>{`
        .admin-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(30, 31, 45, 0.4);
          border: 1px border rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          text-align: left;
        }
        .admin-btn:hover {
          transform: translateX(4px);
          color: white;
        }
      `}</style>
    </div>
  );
}
