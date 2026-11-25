import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../lib/axios';
import { adminService } from '../services/api';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Tổng quan Dashboard',
    subtitle: 'Thống kê & Độ hiếm Gacha',
    icon: LayoutDashboard,
  },
  {
    to: '/foods',
    label: 'Quản lý Món ăn',
    subtitle: 'Thực đơn 365 món & Import',
    icon: UtensilsCrossed,
  },
  {
    to: '/users',
    label: 'Quản lý Người dùng',
    subtitle: 'Hội viên & Lượt quay',
    icon: Users,
  },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const checkApi = async () => {
      const ok = await adminService.checkHealth();
      if (active) setApiOnline(ok);
    };
    checkApi();
    const timer = window.setInterval(checkApi, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    showToast({
      type: 'info',
      title: 'Đã đăng xuất khỏi phiên Quản trị',
      description: 'Hẹn gặp lại bạn trên hệ thống Hôm Nay Ăn Gì?.',
    });
    navigate('/login', { replace: true });
  };

  const activeNav = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to)) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#121212] text-white flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#181818] border-r border-[#D4AF37]/20 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#D4AF37]/15 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-[#D4AF37]/10 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0D1117] border border-[#D4AF37]/60 overflow-hidden flex items-center justify-center shadow-gold-sm shrink-0">
                <img
                  src="/logo.png"
                  alt="Logo Hôm Nay Ăn Gì?"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-lg font-bold tracking-tight text-white">
                    Hôm Nay Ăn Gì
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Luxury Admin Console
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-neutral-400 hover:text-white p-1"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            Điều hướng hệ thống
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent border-[#D4AF37]/50 text-white shadow-gold-sm'
                      : 'border-transparent text-neutral-400 hover:bg-[#1E1E1E] hover:text-white hover:border-white/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#121212]'
                          : 'bg-[#242424] text-neutral-300 group-hover:text-[#D4AF37]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive ? 'text-[#F5E6B3]' : 'text-neutral-200'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">{item.subtitle}</p>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* API Status & Admin Card */}
        <div className="p-4 border-t border-[#D4AF37]/15 space-y-3 bg-[#151515]">
          <div className="rounded-xl bg-[#1E1E1E] border border-white/5 px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-neutral-400">REST API Backend</p>
              <p className="text-[11px] text-neutral-500 truncate" title={API_BASE_URL}>
                {API_BASE_URL}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                apiOnline === null
                  ? 'bg-neutral-700/40 text-neutral-300'
                  : apiOnline
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {apiOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {apiOnline === null ? 'Đang kiểm tra' : apiOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="rounded-2xl bg-[#1E1E1E] border border-[#D4AF37]/25 p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0">
                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name || 'Quản Trị Viên'}
                </p>
                <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4AF37]">
                <ShieldCheck className="w-3.5 h-3.5" />
                ROLE: {user?.role || 'ADMIN'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-[#121212]/90 backdrop-blur-md border-b border-[#D4AF37]/15 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-xl bg-[#1E1E1E] border border-[#D4AF37]/30 p-2 text-[#D4AF37]"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                {activeNav.label}
              </h1>
              <p className="hidden sm:block text-xs text-neutral-400 truncate">
                {activeNav.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full bg-[#1E1E1E] border border-[#D4AF37]/25 px-3.5 py-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-neutral-300">Đồng bộ chuẩn App Android</span>
              <span className="text-[#D4AF37] font-bold">Luxury Gold</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
