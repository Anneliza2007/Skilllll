import React, { useState } from 'react';
import { Sparkles, Shield, User, KeyRound, Mail, ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { AuthUser } from '../types';
import { PREDEFINED_USERS } from '../data/userAccounts';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'credentials' | 'google'>('credentials');
  
  // Credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Google email direct state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isSimulatingGoogle, setIsSimulatingGoogle] = useState(false);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    const trimmedPass = password;

    if (!trimmedUser || !trimmedPass) {
      setError('Please enter both username/email and password.');
      return;
    }

    // Check predefined users (all 10 accounts across Levels 1-5 + Admin)
    const found = PREDEFINED_USERS.find(
      (acc) =>
        (acc.username.toLowerCase() === trimmedUser.toLowerCase() ||
          acc.user.email.toLowerCase() === trimmedUser.toLowerCase()) &&
        acc.password === trimmedPass
    );

    if (found) {
      onLoginSuccess({
        ...found.user,
        profileData: found.profile,
        statsData: found.stats,
      });
      return;
    }

    // Fallback error
    setError('Invalid credentials. Please verify your username and password.');
  };

  const handleGoogleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = googleEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please provide a valid Google Gmail address (e.g., student@gmail.com).');
      return;
    }

    setIsSimulatingGoogle(true);
    setTimeout(() => {
      setIsSimulatingGoogle(false);
      const namePart = googleName.trim() || trimmedEmail.split('@')[0];
      const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      
      onLoginSuccess({
        id: `usr_g_${Date.now()}`,
        name: capitalized,
        email: trimmedEmail,
        role: 'student',
        provider: 'google',
        joinedAt: new Date().toISOString(),
      });
    }, 600);
  };

  const handleOneClickGoogle = (sampleMail: string, sampleName: string) => {
    setIsSimulatingGoogle(true);
    setTimeout(() => {
      setIsSimulatingGoogle(false);
      onLoginSuccess({
        id: `usr_g_${Date.now()}`,
        name: sampleName,
        email: sampleMail,
        role: 'student',
        provider: 'google',
        joinedAt: new Date().toISOString(),
      });
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/25 mb-4">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-sky-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
            SkillMatcher Launchpad
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sign in to access personalized internships, weak-point diagnostics, and resume AI.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Sign In Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('credentials'); setError(null); }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-slate-800 text-sky-400 shadow border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Username & Pass</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('google'); setError(null); }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-slate-800 text-sky-400 shadow border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Mail</span>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Credentials Form (User & Pass) */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter test or admin"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Sign In with Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: Google Mail Direct Sign-In */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              {/* Quick Google One-Click Button */}
              <button
                type="button"
                onClick={() => handleOneClickGoogle('alex.chen.student@gmail.com', 'Alex Chen')}
                disabled={isSimulatingGoogle}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-75"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSimulatingGoogle ? 'Signing in with Google...' : 'Continue as Alex Chen (Gmail)'}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500 font-medium text-[10px]">
                    Or enter any Google Mail address
                  </span>
                </div>
              </div>

              <form onSubmit={handleGoogleDirectSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Google Mail / Workspace Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="e.g., student@gmail.com"
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      placeholder="e.g., Sarah Jenkins"
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSimulatingGoogle}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isSimulatingGoogle ? 'Verifying Google Account...' : 'Continue with this Google Email'}</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Security & Role Footer Info */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted local session • Role-based access control</span>
          </div>
        </div>
      </div>
    </div>
  );
}
