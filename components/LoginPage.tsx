'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { LayoutGrid, Mail, Lock, LogIn, UserPlus, Chrome, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase is not properly configured. Please check your environment variables.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!auth) {
      setError('Firebase is not properly configured. Please check your environment variables.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#5865F220,transparent_70%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-white/10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/20 rotate-12">
            <LayoutGrid className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">
            {isLogin ? 'Welcome back!' : 'Create an account'}
          </h1>
          <p className="text-white/30 text-lg font-medium">
            {isLogin ? "We're so excited to see you again!" : "Join our community today."}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm mb-8 flex items-center gap-3 backdrop-blur-md">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-white/20 absolute left-5 top-5" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 text-white rounded-2xl pl-14 pr-6 py-5 focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 backdrop-blur-md transition-all font-black tracking-tight text-lg"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-white/20 absolute left-5 top-5" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 text-white rounded-2xl pl-14 pr-6 py-5 focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 backdrop-blur-md transition-all font-black tracking-tight text-lg"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl border border-white/20 disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-transparent backdrop-blur-3xl px-4 text-white/20 font-black">Or continue with</span></div>
        </div>

        <button 
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/10 disabled:opacity-50 uppercase tracking-widest text-xs shadow-xl"
        >
          <Chrome className="w-5 h-5" /> Google
        </button>

        <p className="text-center mt-10 text-sm font-medium text-white/30">
          {isLogin ? "Need an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-white hover:text-white/80 ml-2 font-black underline underline-offset-4"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
