import React, { useState } from 'react';
import { Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        // Small delay to show success state
        setTimeout(() => {
          onLogin(data.token);
          window.location.href = '/admin/dashboard';
        }, 800);
      } else {
        setError(data.message || 'Login failed');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Login error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 overflow-hidden relative selection:bg-violet-500/30">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/30 rounded-full blur-[128px] animate-blob mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-[128px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[128px] animate-blob animation-delay-4000 mix-blend-screen"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 perspective-1000">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-violet-500/10 hover:border-white/20">

          {/* Header Section */}
          <div className="relative p-8 pb-0 text-center">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

            <div className="relative mx-auto w-20 h-20 mb-6 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-full h-full bg-slate-900/90 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Lock className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin Portal</h2>
            <p className="text-slate-400 text-sm font-medium">Authentication Required</p>
          </div>

          {/* Form Section */}
          <div className="p-8 pt-6">
            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* Error Message */}
              {error && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-300 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl flex items-center gap-3 text-sm font-medium backdrop-blur-md shadow-lg shadow-red-500/5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  {error}
                </div>
              )}

              {/* Username Field */}
              <div className="group space-y-2">
                <div className={`relative transition-all duration-300 ${focusedField === 'username' ? 'transform scale-[1.02]' : ''}`}>
                  <div className={`absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl opacity-0 transition-opacity duration-300 -z-10 blur-sm ${focusedField === 'username' ? 'opacity-50' : ''}`}></div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-white">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900/80 transition-all duration-300 font-medium"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="group space-y-2">
                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'transform scale-[1.02]' : ''}`}>
                  <div className={`absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl opacity-0 transition-opacity duration-300 -z-10 blur-sm ${focusedField === 'password' ? 'opacity-50' : ''}`}></div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-white">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900/80 transition-all duration-300 font-medium tracking-wide"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group overflow-hidden bg-white text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 shadow-lg hover:shadow-white/20"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-200 via-white to-fuchsia-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Dashboard Access</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-slate-950/30 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Secure System &bull; Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>

      {/* CSS for custom animations if not in tailwind config */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;