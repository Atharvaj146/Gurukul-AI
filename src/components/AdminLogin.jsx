import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Shield, Lock, ArrowRight, Brain } from 'lucide-react';

export default function AdminLogin() {
  const { navigate, notify, dispatch } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        notify('Admin Authentication Successful', 'success');
        localStorage.setItem('guru_admin_token', 'true');
        navigate('admin');
      } else {
        notify('Invalid Admin Credentials', 'error');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10 space-y-8 animate-slide-up">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Admin Gateway</h1>
          <p className="text-surface-400">Secure access to platform diagnostics</p>
        </div>

        <form onSubmit={handleLogin} className="bento-card p-8 bg-surface-900/60 backdrop-blur-xl border border-white/5 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-widest">Admin Email</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium w-full"
                placeholder="admin@gurukul.ai"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-widest">Master Password</label>
              <div className="relative">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium w-full pl-10"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : <>Access Control Center <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <button 
          onClick={() => navigate('upload')}
          className="w-full text-center text-sm text-surface-500 hover:text-surface-300 transition-colors flex items-center justify-center gap-2"
        >
          <Brain className="w-4 h-4" /> Return to Student Portal
        </button>
      </div>
    </div>
  );
}
