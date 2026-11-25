import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Crown,
  Dices,
  Heart,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
} from 'lucide-react';
import { formatVND } from '../constants/rarity';
import { RarityBadge } from '../components/RarityBadge';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../lib/axios';
import { foodService, userService, UsersOverviewResult } from '../services/api';

function formatDate(isoOrMs?: string | number | null): string {
  if (!isoOrMs) return '—';
  const d = new Date(isoOrMs);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export const UsersPage: React.FC = () => {
  const { showToast } = useToast();
  const [overview, setOverview] = useState<UsersOverviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setErrorMsg(null);
      const res = await userService.getUsersOverview();
      setOverview(res);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Không thể tải danh sách hội viên.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordTestSpin = async () => {
    try {
      setSpinning(true);
      const res = await foodService.spinGachaTest();
      showToast({
        type: 'success',
        title: `Đã ghi nhận +1 lượt quay: ${res.food.name}`,
        description: `Độ hiếm: ${res.rolledRarity} • Dữ liệu lượt quay đã được cập nhật.`,
      });
      await loadData(true);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Lỗi khi quay thử',
        description: extractErrorMessage(err),
      });
    } finally {
      setSpinning(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const list = overview?.members || [];
    const q = search.toLowerCase().trim();
    return list.filter((m) => {
      if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
      if (q) {
        const hay = `${m.name} ${m.email} ${m.id} ${m.firebaseUid || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [overview, search, roleFilter]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <p className="text-sm text-neutral-400">Đang tải danh sách hội viên & thống kê lượt quay...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="luxury-card p-8 text-center max-w-xl mx-auto mt-10 space-y-4">
        <p className="text-base font-bold text-rose-300">{errorMsg}</p>
        <button type="button" onClick={() => loadData()} className="luxury-btn-gold">
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </button>
      </div>
    );
  }

  const totalUsers = overview?.stats.totalUsers ?? filteredMembers.length;
  const totalSpins = overview?.stats.totalSpins ?? 0;
  const avgSpins = totalUsers > 0 ? (totalSpins / totalUsers).toFixed(1) : '0.0';
  const adminCount = (overview?.members || []).filter((m) => m.role === 'ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="luxury-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Quản lý Hội viên & Lượt quay Gacha
          </h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Theo dõi danh sách hội viên đăng ký từ ứng dụng Android và tần suất quay thưởng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={spinning}
            onClick={handleRecordTestSpin}
            className="luxury-btn-outline"
          >
            {spinning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Dices className="w-4 h-4" />
            )}
            Quay thử (+1 Lượt quay)
          </button>

          <button type="button" onClick={() => loadData()} className="luxury-btn-gold">
            <RefreshCw className="w-4 h-4" />
            Đồng bộ dữ liệu
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="luxury-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Tổng Hội viên
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white">{totalUsers}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="luxury-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Tổng Lượt quay Gacha
            </p>
            <p className="mt-2 text-2xl font-extrabold text-[#D4AF37]">{totalSpins}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-400/35 flex items-center justify-center text-purple-300">
            <Dices className="w-5 h-5" />
          </div>
        </div>

        <div className="luxury-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Trung bình / Hội viên
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white">{avgSpins} lượt</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-400/35 flex items-center justify-center text-sky-300">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="luxury-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Quản trị viên (ADMIN)
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white">{adminCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center text-emerald-300">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Role Filter */}
      <div className="luxury-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm hội viên theo tên, email hoặc Firebase UID..."
            className="luxury-input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'ADMIN', 'USER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition-all ${
                roleFilter === r
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3D573]'
                  : 'bg-[#141414] border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {r === 'ALL' ? 'Tất cả vai trò' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="luxury-card overflow-hidden">
        <div className="px-6 py-4 bg-[#171717] border-b border-[#D4AF37]/20 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F3D573]">
            Danh sách Hội viên ({filteredMembers.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#151515] border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="py-3.5 px-5">Hội viên</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Phương thức liên kết</th>
                <th className="py-3.5 px-4 text-center">Lượt quay Gacha</th>
                <th className="py-3.5 px-4 text-center">Món yêu thích</th>
                <th className="py-3.5 px-4">Món trúng gần nhất</th>
                <th className="py-3.5 px-5 text-right">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredMembers.map((member) => {
                const isAdmin = member.role === 'ADMIN';
                return (
                  <tr key={member.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5 min-w-[230px]">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isAdmin
                              ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3D573]'
                              : 'bg-white/5 border-white/15 text-neutral-200'
                          }`}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{member.name}</p>
                          <p className="text-xs text-neutral-400 truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 px-2.5 py-0.5 text-[11px] font-bold text-[#F3D573]">
                          <ShieldCheck className="w-3 h-3" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-400/35 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                          HỘI VIÊN
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {member.firebaseUid ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                          <Smartphone className="w-3.5 h-3.5" />
                          Firebase Android
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Email & Mật khẩu JWT</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3 py-1 text-xs font-extrabold text-[#F3D573]">
                        <Dices className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {member.spinCount.toLocaleString('vi-VN')} lượt
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300">
                        <Heart className="w-3.5 h-3.5 fill-rose-400/40 text-rose-400" />
                        {member.favoritesCount}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {member.lastSpinFood ? (
                        <span className="text-xs font-medium text-neutral-200">
                          {member.lastSpinFood}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500">Chưa quay</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap text-xs text-neutral-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        {formatDate(member.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Spin History Log */}
      <div className="luxury-card p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h3 className="text-base font-bold text-white">Nhật ký Lượt quay Gacha Gần đây</h3>
              <p className="text-xs text-neutral-400">
                 Chi tiết các phiên quay thưởng lưu trong `SpinHistory`
              </p>
            </div>
          </div>
        </div>

        {!overview?.recentHistory || overview.recentHistory.length === 0 ? (
          <div className="rounded-2xl bg-[#151515] border border-white/5 p-6 text-center">
            <p className="text-sm text-neutral-400">
              Chưa có nhật ký quay thưởng nào. Bấm{' '}
              <strong className="text-[#D4AF37]">"Quay thử (+1 Lượt quay)"</strong> để tạo dữ liệu thực!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {overview.recentHistory.slice(0, 9).map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl bg-[#161616] border border-white/10 p-3.5 flex items-center gap-3"
              >
                <img
                  src={entry.food.imageUrl}
                  alt={entry.food.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/25 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{entry.food.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <RarityBadge rarity={entry.food.rarity} />
                    <span className="text-xs font-semibold text-[#D4AF37]">
                      {formatVND(entry.food.price)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.timestampMillis)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
