import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { Brain, Lock, Mail, User, Shield } from 'lucide-react';

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { navigate, notify } = useSession();
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('Please enter your full name');
        await signUp(email, password, fullName);
        notify('Account created! Please check your email to verify.', 'success');
      } else {
        await signIn(email, password);
        notify('Welcome back!', 'success');
        navigate('upload'); // Redirect to dashboard or upload
      }
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-brand-gold/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#050B16] blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-navyDark border border-brand-gold/20 shadow-[0_0_30px_rgba(232,139,35,0.15)] mb-6">
            <Brain className="w-8 h-8 text-brand-gold" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">Gurukul AI</h1>
          <p className="text-surface-400 mt-2">Sign in to sync your brain's progress</p>
        </div>

        <div className="bento-card p-8 bg-surface-900/60 backdrop-blur-xl border border-white/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-premium w-full pl-10 bg-black/20"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium w-full pl-10 bg-black/20"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium w-full pl-10 bg-black/20"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-surface-800"></div>
            <span className="text-sm text-surface-500 font-medium">Or continue with</span>
            <div className="flex-1 h-px bg-surface-800"></div>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (error) {
                notify(error.message, 'error');
              }
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-surface-700 bg-surface-800/50 hover:bg-surface-700 hover:border-surface-600 transition-colors text-white font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            Sign in with Google
          </button>

          <div className="mt-6 text-center text-sm text-surface-400">
            {isSignUp ? 'Already have an account?' : 'New to Gurukul?'}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-brand-gold hover:text-yellow-300 font-medium transition-colors"
            >
              {isSignUp ? 'Sign in instead' : 'Create an account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
