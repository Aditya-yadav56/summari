import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, signup, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Successfully logged in!");
      } else {
        await signup(email, password);
        toast.success("Account created successfully!");
      }
      closeAuthModal();
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      toast.success("Successfully logged in with Google!");
      closeAuthModal();
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
      <div 
        className="relative w-full max-w-[360px] border shadow-2xl rounded-[24px] overflow-hidden p-6 animate-blur-in-up"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-glass)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full transition-colors opacity-60 hover:opacity-100"
          style={{ color: 'var(--text-primary)', background: 'var(--border-glass)' }}
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-serif)", color: 'var(--text-primary)' }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-xs mt-1.5 opacity-60" style={{ color: 'var(--text-primary)' }}>
            {isLogin ? "Enter your details to sign in." : "Join us to save your summaries."}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm"
                style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm"
                style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold tracking-wide transition-all disabled:opacity-70 flex items-center justify-center shadow-lg text-sm"
            style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100"></div>
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Or continue with</span>
          <div className="flex-1 h-px bg-gray-100"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-5 w-full py-2.5 border rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)' }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
            <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
            <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03296C-0.371021 20.0112 -0.371021 28.0009 3.03296 34.7825L11.0051 28.6006Z" fill="#FBBC05"/>
            <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4418 -0.068932 24.48 0.00165733C15.4056 0.00165733 7.10718 5.11644 3.03296 13.2296L11.0051 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 text-center text-xs opacity-60" style={{ color: 'var(--text-primary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="font-bold hover:underline focus:outline-none ml-1"
            style={{ color: 'var(--text-primary)', opacity: 1 }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
