import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileJson,
  Filter,
  Image as ImageIcon,
  Leaf,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_MAIN_GROUPS,
  formatVND,
  normalizeMainGroup,
  RARITY_ORDER,
} from '../constants/rarity';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { FoodFormModal } from '../components/FoodFormModal';
import { ImportFoodsModal } from '../components/ImportFoodsModal';
import { RarityBadge } from '../components/RarityBadge';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../lib/axios';
import { foodService } from '../services/api';
import { Food, FoodFormData } from '../types';

function normalizeSearch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export const FoodsPage: React.FC = () => {
  const { showToast } = useToast();

  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'price-asc' | 'price-desc' | 'rating-desc'>('id');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const loadFoods = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await foodService.getFoods();
      setAllFoods(res.data);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Không thể tải danh sách món ăn từ GET /api/foods.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  // Dynamic group list combining default groups and actual DB groups
  const groupOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_MAIN_GROUPS);
    for (const f of allFoods) {
      if (f.mainGroup) set.add(normalizeMainGroup(f.mainGroup));
    }
    return Array.from(set);
  }, [allFoods]);

  const filteredFoods = useMemo(() => {
    const keyword = normalizeSearch(search);

    const list = allFoods.filter((food) => {
      const normalizedGroup = normalizeMainGroup(food.mainGroup);
      if (selectedGroup && normalizedGroup !== selectedGroup) return false;
      if (selectedRarity && (food.rarity || '').toUpperCase() !== selectedRarity) return false;
      if (vegFilter === 'veg' && !food.isVegetarian) return false;
      if (vegFilter === 'non-veg' && food.isVegetarian) return false;

      if (keyword) {
        const haystack = normalizeSearch(
          `${food.id} ${food.name} ${food.mainGroup} ${food.subCategory} ${food.restaurantName} ${food.restaurantAddress}`
        );
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

    return list;
  }, [allFoods, search, selectedGroup, selectedRarity, vegFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedGroup, selectedRarity, vegFilter, sortBy, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedFoods = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredFoods.slice(start, start + pageSize);
  }, [filteredFoods, safePage, pageSize]);

  const handleOpenAdd = () => {
    setEditingFood(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (food: Food) => {
    setEditingFood(food);
    setFormOpen(true);
  };

  const handleSaveFood = async (payload: FoodFormData) => {
    try {
      if (editingFood) {
        const updated = await foodService.updateFood(editingFood.id, payload);
        setAllFoods((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        showToast({
          type: 'success',
          title: 'Cập nhật món ăn thành công',
          description: `Đã lưu thay đổi cho "${updated.name}" (${updated.id}).`,
        });
      } else {
        const created = await foodService.createFood(payload);
        setAllFoods((prev) => [created, ...prev]);
        showToast({
          type: 'success',
          title: 'Thêm món ăn mới thành công',
          description: `Đã thêm "${created.name}" (${created.rarity}) vào thực đơn.`,
        });
      }
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Lỗi khi lưu thông tin món ăn.'));
    }
  };

  const handleConfirmDelete = async (food: Food) => {
    try {
      const msg = await foodService.deleteFood(food.id);
      setAllFoods((prev) => prev.filter((item) => item.id !== food.id));
      showToast({
        type: 'success',
        title: 'Đã xóa món ăn',
        description: msg,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Không thể xóa món ăn',
        description: extractErrorMessage(err),
      });
      throw err;
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedGroup('');
    setSelectedRarity('');
    setVegFilter('all');
    setSortBy('id');
  };

  const hasActiveFilters =
    Boolean(search) || Boolean(selectedGroup) || Boolean(selectedRarity) || vegFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="luxury-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Kho Thực Đơn & Vật Phẩm Gacha
          </h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Hiển thị{' '}
            <span className="text-[#D4AF37] font-bold">{filteredFoods.length}</span> /{' '}
            <span className="text-white font-semibold">{allFoods.length}</span> món ăn từ{' '}
            <code className="text-[#D4AF37]">GET /api/foods</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadFoods}
            disabled={loading}
            className="rounded-xl bg-[#141414] border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-neutral-300 hover:border-[#D4AF37]/40 hover:text-white transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D4AF37]' : ''}`} />
            Tải lại
          </button>

          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="luxury-btn-outline"
          >
            <FileJson className="w-4 h-4" />
            Import `foods.json`
          </button>

          <button type="button" onClick={handleOpenAdd} className="luxury-btn-gold">
            <Plus className="w-4 h-4" />
            Thêm món ăn
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="luxury-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
          {/* Search Input */}
          <div className="xl:col-span-2 relative">
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên món, mã ID, danh mục, tên quán (có dấu / không dấu)..."
              className="luxury-input pl-10"
            />
          </div>

          {/* Group Filter */}
          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="luxury-input"
            >
              <option value="">Tất cả nhóm bữa ăn</option>
              {groupOptions.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Rarity Filter */}
          <div>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="luxury-input"
            >
              <option value="">Tất cả bậc độ hiếm</option>
              {RARITY_ORDER.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="luxury-input"
            >
              <option value="id">Sắp xếp: Mã ID (Mặc định)</option>
              <option value="price-asc">Giá: Thấp → Cao</option>
              <option value="price-desc">Giá: Cao → Thấp</option>
              <option value="rating-desc">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>

        {/* Sub-bar: Vegetarian pills & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
              Chế độ ăn:
            </span>
            {(
              [
                { key: 'all', label: 'Tất cả' },
                { key: 'veg', label: 'Món Chay' },
                { key: 'non-veg', label: 'Món Mặn' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setVegFilter(opt.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                  vegFilter === opt.key
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3D573]'
                    : 'bg-[#141414] border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="luxury-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
            <p className="text-sm text-neutral-400">Đang tải danh sách món ăn...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-300">{errorMsg}</p>
            <button type="button" onClick={loadFoods} className="luxury-btn-gold">
              Thử lại
            </button>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <p className="text-base font-bold text-white">
              Không tìm thấy món ăn nào khớp với bộ lọc hiện tại
            </p>
            <p className="text-xs text-neutral-400">
              Hãy thử từ khóa khác, xóa bộ lọc hoặc Import dữ liệu từ file `foods.json`.
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="luxury-btn-outline mt-2">
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#161616] border-b border-[#D4AF37]/20 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3.5 px-5">Món ăn</th>
                    <th className="py-3.5 px-4">Phân loại</th>
                    <th className="py-3.5 px-4">Giá tham khảo</th>
                    <th className="py-3.5 px-4">Độ hiếm Gacha</th>
                    <th className="py-3.5 px-4">Nhà hàng gợi ý</th>
                    <th className="py-3.5 px-4 text-center">Đánh giá</th>
                    <th className="py-3.5 px-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {paginatedFoods.map((food) => (
                    <tr
                      key={food.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Dish */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5 min-w-[220px]">
                          <div className="w-12 h-12 rounded-xl bg-[#141414] border border-[#D4AF37]/20 overflow-hidden flex items-center justify-center shrink-0">
                            {food.imageUrl ? (
                              <img
                                src={food.imageUrl}
                                alt={food.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-neutral-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white truncate">{food.name}</p>
                              {food.isVegetarian && (
                                <span
                                  title="Món Chay"
                                  className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 shrink-0"
                                >
                                  <Leaf className="w-2.5 h-2.5" />
                                  Chay
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 font-mono mt-0.5">{food.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="text-xs font-bold text-neutral-200">{normalizeMainGroup(food.mainGroup)}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{food.subCategory}</p>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-[#D4AF37]">
                          {formatVND(food.price)}
                        </span>
                      </td>

                      {/* Rarity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <RarityBadge rarity={food.rarity} />
                      </td>

                      {/* Restaurant */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <p className="text-xs font-semibold text-neutral-200 truncate">
                          {food.restaurantName || food.restaurant?.name}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0 text-[#D4AF37]/70" />
                          {food.restaurantAddress || food.restaurant?.address}
                        </p>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#141414] border border-white/10 px-2 py-1 text-xs font-bold text-[#F3D573]">
                          <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                          {Number(food.rating ?? 4.8).toFixed(1)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(food)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-3 py-1.5 text-xs font-bold text-[#F3D573] hover:bg-[#D4AF37] hover:text-[#121212] transition-all"
                            title="Sửa món ăn"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingFood(food)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-600 hover:text-white transition-all"
                            title="Xóa món ăn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-4 bg-[#161616] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span>
                  Trang <strong className="text-white">{safePage}</strong> / {totalPages} (Tổng{' '}
                  <strong className="text-[#D4AF37]">{filteredFoods.length}</strong> món)
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-lg bg-[#1E1E1E] border border-white/10 px-2.5 py-1 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value={12}>12 món / trang</option>
                  <option value={25}>25 món / trang</option>
                  <option value={50}>50 món / trang</option>
                  <option value={100}>100 món / trang</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:border-[#D4AF37]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:border-[#D4AF37]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <FoodFormModal
        open={formOpen}
        editingFood={editingFood}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSaveFood}
      />

      <ConfirmDeleteModal
        food={deletingFood}
        onClose={() => setDeletingFood(null)}
        onConfirm={handleConfirmDelete}
      />

      <ImportFoodsModal
        open={importOpen}
        existingFoods={allFoods}
        onClose={() => setImportOpen(false)}
        onImported={loadFoods}
      />
    </div>
  );
};
