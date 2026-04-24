/**
 * App.jsx — Main application shell for Gurukul AI
 * Routes between screens based on session state
 */
import { SessionProvider, useSession } from './context/SessionContext';
import Upload from './components/Upload';
import Diagnostic from './components/Diagnostic';
import GapAnalysis from './components/GapAnalysis';
import Roadmap from './components/Roadmap';
import QuizCard from './components/QuizCard';
import Dashboard from './components/Dashboard';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

function AppContent() {
  const { currentScreen, loading, error, notification, dispatch } = useSession();

  const screens = {
    'upload': Upload,
    'diagnostic': Diagnostic,
    'gap-analysis': GapAnalysis,
    'roadmap': Roadmap,
    'quiz': QuizCard,
    'dashboard': Dashboard,
  };

  const Screen = screens[currentScreen] || Upload;

  return (
    <div className="relative">
      {/* Global Error Banner */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-slide-down">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => dispatch({ type: 'CLEAR_ERROR' })} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-down">
          <div className={`flex items-center gap-3 p-4 rounded-xl backdrop-blur-lg border ${
            notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
            notification.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
            'bg-guru-500/10 border-guru-500/20'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <Info className="w-5 h-5 text-guru-400" />
            )}
            <p className={`text-sm ${
              notification.type === 'success' ? 'text-emerald-300' :
              notification.type === 'error' ? 'text-red-300' :
              'text-guru-300'
            }`}>{notification.message}</p>
          </div>
        </div>
      )}

      {/* Screen */}
      <Screen />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
