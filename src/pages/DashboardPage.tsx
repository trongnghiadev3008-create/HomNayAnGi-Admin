import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Award,
  Dices,
  Heart,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { formatVND, RARITY_CONFIG, RARITY_ORDER } from '../constants/rarity';
import { RarityBadge } from '../components/RarityBadge';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../lib/axios';
import { adminService, foodService } from '../services/api';
import { AdminStats } from '../types';

const GROUP_COLORS = ['#D4AF37', '#38BDF8', '#C084FC', '#FB7185', '#34D399', '#F59E0B'];

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setErrorMsg(null);
      const data = await adminService.getStats(8);
      setStats(data);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Không thể tải dữ liệu thống kê từ /api/admin/stats.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTestSpin = async () => {
    try {
      setSpinning(true);
      const res = await foodService.spinGachaTest();
      showToast({
        type: 'success',
        title: `Quay thử trúng: ${res.food.name}`,
        description: `Độ hiếm: ${res.rolledRarity} • Giá: ${formatVND(res.food.price)}`,
      });
      await fetchStats(true);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Không thể quay thử Gacha',
        description: extractErrorMessage(err),
      });
    } finally {
      setSpinning(false);
    }
  };

  /**
   * Chuẩn hóa dữ liệu biểu đồ phân bổ độ hiếm theo đúng thứ tự THƯỜNG -> CỔ VẬT
   */
  const rarityChartData = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const item of stats?.byRarity || []) {
      const key = (item.rarity || 'THƯỜNG').toUpperCase().trim();
      countMap.set(key, (countMap.get(key) || 0) + item.count);
    }

    const total = stats?.totalFoods || 0;

    return RARITY_ORDER.map((tier) => {
      const meta = RARITY_CONFIG[tier];
      const count = countMap.get(tier) || 0;
      const sharePercent = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      return {
        rarity: tier,
        label: meta.label,
        count,
        sharePercent,
        gachaRate: meta.dropRate,
        color: meta.color,
      };
    });
  }, [stats]);

  const mainGroupData = useMemo(() => {
    return (stats?.byMainGroup || []).map((g, idx) => ({
      name: g.mainGroup,
      value: g.count,
      color: GROUP_COLORS[idx % GROUP_COLORS.length],
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 text-[#D4AF37] animate-spin" />
        <p className="text-sm text-neutral-400">Đang đồng bộ thống kê từ GET /api/admin/stats...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="luxury-card p-8 text-center max-w-xl mx-auto mt-10 space-y-4">
        <p className="text-base font-bold text-rose-300">{errorMsg}</p>
        <button type="button" onClick={() => fetchStats()} className="luxury-btn-gold">
          <RefreshCw className="w-4 h-4" />
          Thử lại ngay
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tổng số Món ăn',
      value: stats?.totalFoods ?? 0,
      subtitle: 'Kho thực đơn Gacha chuẩn vị',
      icon: UtensilsCrossed,
      accent: 'from-[#D4AF37]/25 to-transparent',
      iconBg: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40',
    },
    {
      title: 'Tổng Hội viên',
      value: stats?.totalUsers ?? 0,
      subtitle: 'Tài khoản đồng bộ App & Web',
      icon: Users,
      accent: 'from-sky-500/20 to-transparent',
      iconBg: 'bg-sky-500/15 text-sky-300 border-sky-400/35',
    },
    {
      title: 'Tổng Lượt quay Gacha',
      value: stats?.totalSpins ?? 0,
      subtitle: 'Lịch sử quay thưởng đã lưu',
      icon: Dices,
      accent: 'from-purple-500/20 to-transparent',
      iconBg: 'bg-purple-500/15 text-purple-300 border-purple-400/35',
    },
    {
      title: 'Tổng Lượt Yêu thích',
      value: stats?.totalFavorites ?? 0,
      subtitle: 'Món ăn được hội viên thả tim',
      icon: Heart,
      accent: 'from-rose-500/20 to-transparent',
      iconBg: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
    },
  ];

  return (
    <div className="space-y-7">
      {/* Top Banner */}
      <div className="luxury-card p-6 bg-dark-radial flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Trung tâm điều hành ẩm thực
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            Báo cáo Tổng quan Hệ sinh thái
          </h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Số liệu thời gian thực từ <code className="text-[#D4AF37]">GET /api/admin/stats</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={spinning}
            onClick={handleTestSpin}
            className="luxury-btn-outline"
          >
            {spinning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Dices className="w-4 h-4" />
            )}
            Quay thử Gacha
          </button>
          <button type="button" onClick={() => fetchStats()} className="luxury-btn-gold">
            <RefreshCw className="w-4 h-4" />
            Làm mới số liệu
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="luxury-card luxury-card-hover relative overflow-hidden p-6"
            >
              <div
                className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${card.accent} pointer-events-none`}
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {card.title}
                  </p>
                  <p className="mt-2.5 text-3xl font-extrabold text-white tracking-tight">
                    {card.value.toLocaleString('vi-VN')}
                  </p>
                  <p className="mt-1.5 text-xs text-neutral-400">{card.subtitle}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${card.iconBg}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section: Rarity Distribution (THƯỜNG -> CỔ VẬT) + Meal Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rarity Chart (2/3 width) */}
        <div className="lg:col-span-2 luxury-card p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">
                Phân bổ Độ hiếm Món ăn (`THƯỜNG` → `CỔ VẬT`)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Thống kê số lượng món theo 5 bậc Gacha đồng bộ với ứng dụng Android
              </p>
            </div>
            <Link
              to="/foods"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37] hover:underline"
            >
              Quản lý thực đơn
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rarityChartData}
                margin={{ top: 10, right: 16, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="rarity"
                  tick={{ fill: '#D4D4D8', fontSize: 12, fontWeight: 700 }}
                  axisLine={{ stroke: 'rgba(212,175,55,0.25)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#A1A1AA', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(212, 175, 55, 0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as (typeof rarityChartData)[number];
                    return (
                      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/40 px-4 py-3 shadow-luxury text-xs space-y-1">
                        <p className="font-extrabold text-sm" style={{ color: item.color }}>
                          {item.rarity}
                        </p>
                        <p className="text-white font-semibold">
                          Số lượng: <span className="text-[#D4AF37]">{item.count} món</span> (
                          {item.sharePercent}% kho món)
                        </p>
                        <p className="text-neutral-400">
                          Trọng số rơi Gacha chuẩn: {item.gachaRate}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} maxBarSize={58}>
                  {rarityChartData.map((entry) => (
                    <Cell key={entry.rarity} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 5-Tier Pill Breakdown */}
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {rarityChartData.map((item) => (
              <div
                key={item.rarity}
                className="rounded-xl bg-[#151515] border border-white/5 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-[11px] font-extrabold tracking-wide"
                    style={{ color: item.color }}
                  >
                    {item.rarity}
                  </span>
                  <span className="text-[10px] text-neutral-500">{item.gachaRate}% Gacha</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-white">
                  {item.count}{' '}
                  <span className="text-xs font-normal text-neutral-400">
                    ({item.sharePercent}%)
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Group Donut Chart (1/3 width) */}
        <div className="luxury-card p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Cơ cấu theo Nhóm bữa ăn</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Phân bổ thực đơn theo `mainGroup`
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mainGroupData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={4}
                >
                  {mainGroupData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="#1E1E1E" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as (typeof mainGroupData)[number];
                    return (
                      <div className="rounded-xl bg-[#141414] border border-[#D4AF37]/40 px-3 py-2 text-xs">
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[#D4AF37] font-semibold">{item.value} món ăn</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto space-y-2 pt-3 border-t border-white/10">
            {mainGroupData.map((g) => (
              <div key={g.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-neutral-300 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  {g.name}
                </span>
                <span className="font-bold text-white">{g.value} món</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Spun Foods Leaderboard */}
      <div className="luxury-card p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h3 className="text-base font-bold text-white">
                Top Món ăn Được quay trúng nhiều nhất
              </h3>
              <p className="text-xs text-neutral-400">
                Xếp hạng theo lịch sử quay thưởng thực tế của người dùng
              </p>
            </div>
          </div>
        </div>

        {!stats?.topSpunFoods || stats.topSpunFoods.length === 0 ? (
          <div className="rounded-2xl bg-[#151515] border border-white/5 p-6 text-center space-y-3">
            <p className="text-sm text-neutral-400">
              Chưa có lượt quay Gacha nào được ghi nhận. Hãy bấm nút{' '}
              <strong className="text-[#D4AF37]">"Quay thử Gacha"</strong> phía trên để kiểm thử!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.topSpunFoods.map((item, idx) => (
              <div
                key={item.food.id}
                className="rounded-2xl bg-[#161616] border border-white/10 hover:border-[#D4AF37]/40 p-4 flex items-center gap-3.5 transition-all"
              >
                <div className="relative shrink-0">
                  <img
                    src={item.food.imageUrl}
                    alt={item.food.name}
                    className="w-14 h-14 rounded-xl object-cover border border-[#D4AF37]/25"
                  />
                  <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#D4AF37] text-[#121212] text-xs font-extrabold flex items-center justify-center shadow">
                    #{idx + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{item.food.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <RarityBadge rarity={item.food.rarity} />
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400">
                    Trúng thưởng:{' '}
                    <span className="text-[#D4AF37] font-bold">{item.spinCount} lượt</span>
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
