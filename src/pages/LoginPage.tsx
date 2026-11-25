import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, extractErrorMessage } from '../lib/axios';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@homnayangi.vn');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu Quản trị viên.');
      return;
    }

    try {
      setLoading(true);
      const loggedUser = await login(email.trim(), password);
      showToast({
        type: 'success',
        title: `Chào mừng ${loggedUser.name}!`,
        description: 'Đã lưu JWT Token và kích hoạt phiên Quản trị viên.',
      });
      navigate(fromPath, { replace: true });
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@homnayangi.vn');
    setPassword('Admin@123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#121212] relative flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient Luxury Gold Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-[#D4AF37]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Emblem */}
        <div className="text-center mb-7">
          <div className="mx-auto w-24 h-24 rounded-3xl bg-[#0D1117] border-2 border-[#D4AF37]/70 overflow-hidden flex items-center justify-center shadow-gold mb-4">
            <img
              src="/logo.png"
              alt="Logo Hôm Nay Ăn Gì?"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1E1E1E] border border-[#D4AF37]/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">
            <Sparkles className="w-3 h-3" />
            Luxury Admin Portal
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Hôm Nay Ăn Gì?
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            Hệ thống quản trị thực đơn 365 món & Gacha Ẩm thực
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-[#1E1E1E] border border-[#D4AF37]/30 shadow-luxury p-7 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 px-4 py-3 text-xs font-medium text-rose-200 leading-relaxed">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Email Quản trị viên
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@homnayangi.vn"
                  className="luxury-input pl-10 py-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="luxury-input pl-10 pr-10 py-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="luxury-btn-gold w-full py-3 text-sm tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xác thực JWT...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Đăng nhập Quản trị
                </>
              )}
            </button>
          </form>

          {/* Default Admin Credential Helper */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/20 p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Tài khoản Seed mặc định
                </p>
                <p className="text-xs text-neutral-400 truncate mt-0.5">
                  admin@homnayangi.vn • Admin@123
                </p>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="shrink-0 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2.5 py-1.5 text-xs font-semibold text-[#F3D573] hover:bg-[#D4AF37]/25 transition-colors"
              >
                Điền nhanh
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-neutral-500">
          Kết nối trực tiếp tới{' '}
          <code className="text-[#D4AF37]/90 font-medium">{API_BASE_URL}/auth/login</code>
        </p>
      </div>
    </div>
  );
};
