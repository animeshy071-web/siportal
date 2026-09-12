import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import DarkVeil from './DarkVeil';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const ok = await login(email, password);
    setLoading(false);
    if (!ok) { setError('Invalid email or password.'); return; }
    const user = JSON.parse(localStorage.getItem('sis_user') ?? '{}');
    navigate(`/${user.role}`, { replace: true });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 lg:p-10 font-sans overflow-hidden bg-black">
      {/* Full Page DarkVeil Background */}
      <DarkVeil />

      {/* Main Container Card */}

      <div className="w-full max-w-5xl bg-white rounded-[36px] shadow-2xl p-4 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch relative z-10 overflow-hidden backdrop-blur-sm">
        
        {/* Left Column - Login Form */}
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6">
          {/* Top University Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shadow-sm">
              🏛️
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Login
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Please enter your details.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-6 py-3.5 pr-12 rounded-full border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all shadow-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-6 py-3.5 pr-12 rounded-full border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Checkbox + Forgot Password Row */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-600">Remember for 30 days</span>
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Please use the quick-fill buttons below."); }} className="font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#1733A0] via-[#1E3BB6] to-[#2563EB] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-75 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>


        {/* Right Column - Abstract Blue/Purple Wave Visual Panel */}
        <div className="hidden lg:flex relative rounded-[30px] overflow-hidden min-h-[520px] bg-gradient-to-br from-[#10226B] via-[#1E3BB6] to-[#60A5FA]">
          {/* Layered Organic 3D Gradient Waves matching the reference image */}
          <div className="absolute inset-0">
            {/* Top Right Vibrant Violet Glow */}
            <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-transparent opacity-80 blur-2xl" />
            
            {/* Center Curved Wave SVG Overlay */}
            <svg className="absolute inset-0 w-full h-full object-cover" viewBox="0 0 500 700" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#2563EB" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0B1329" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              
              {/* Back Wave */}
              <path d="M 0,0 C 250,100 350,300 500,200 L 500,700 L 0,700 Z" fill="url(#grad1)" />
              
              {/* Front Wave */}
              <path d="M 0,150 C 200,250 300,50 500,400 L 500,700 L 0,700 Z" fill="url(#grad2)" />
              
              {/* Organic Smooth Arc matching reference image curves */}
              <path d="M 200,0 Q 400,250 220,700 L 500,700 L 500,0 Z" fill="#0E1B4E" opacity="0.6" />
              <path d="M 280,0 Q 480,280 290,700 L 500,700 L 500,0 Z" fill="#080F2B" opacity="0.85" />
            </svg>

            {/* Glowing Accent Ring Highlights */}
            <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-purple-500/30 blur-2xl" />
          </div>
          
          {/* Subtle Reflection Glass Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
        </div>

      </div>
    </div>
  );
}



