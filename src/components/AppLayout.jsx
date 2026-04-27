import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { Brain, LayoutDashboard, Map, Zap, BookOpen, LogOut, Shield } from 'lucide-react';

export default function AppLayout({ children }) {
  const { currentScreen, navigate } = useSession();
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'upload', label: 'New Topic', icon: BookOpen },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
    { id: 'quiz', label: 'Practice', icon: Zap },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'onboarding', label: 'Our Science', icon: Brain },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-surface-900 border-r border-surface-800 flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-surface-800">
          <Brain className="w-6 h-6 text-brand-gold mr-3" />
          <span className="font-display font-bold tracking-wide text-white">Gurukul AI</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-gold/10 text-brand-gold shadow-[0_0_15px_rgba(232,139,35,0.05)]' 
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-gold' : 'opacity-70'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        {user && (
          <div className="p-4 border-t border-surface-800">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-brand-navyDark flex items-center justify-center border border-brand-gold/20 flex-shrink-0">
                <span className="text-xs font-bold text-brand-gold">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-surface-200 truncate">{user.user_metadata?.full_name || 'Student'}</p>
                <p className="text-xs text-surface-500 truncate">{user.email}</p>
              </div>
            </div>
            
            <button 
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4 opacity-70" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 max-w-7xl mx-auto w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
