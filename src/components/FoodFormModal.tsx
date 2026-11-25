import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Leaf,
  Loader2,
  MapPin,
  Save,
  Star,
  Store,
  Utensils,
  X,
} from 'lucide-react';
import {
  DEFAULT_MAIN_GROUPS,
  DEFAULT_SUB_CATEGORIES,
  formatVND,
  normalizeMainGroup,
  RARITY_CONFIG,
  RARITY_ORDER,
} from '../constants/rarity';
import { Food, FoodFormData } from '../types';
import { RarityBadge } from './RarityBadge';

interface FoodFormModalProps {
  open: boolean;
  editingFood: Food | null;
  onClose: () => void;
  onSubmit: (data: FoodFormData) => Promise<void>;
}

const EMPTY_FORM: FoodFormData = {
  id: '',
  name: '',
  price: 35000,
  mainGroup: 'Bữa chính',
  subCategory: 'Cơm & xôi',
  rarity: 'THƯỜNG',
  isVegetarian: false,
  rating: 4.8,
  imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
  description: '',
  restaurantName: 'Quán Ngon Sài Gòn - Quận 1',
  restaurantAddress: '160 Pasteur, Bến Nghé, Quận 1, TP.HCM',
  lat: 10.7798,
  lng: 106.6968,
};

export const FoodFormModal: React.FC<FoodFormModalProps> = ({
  open,
  editingFood,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<FoodFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setImgError(false);

    if (editingFood) {
      setForm({
        id: editingFood.id,
        name: editingFood.name,
        price: editingFood.price,
        mainGroup: normalizeMainGroup(editingFood.mainGroup),
        subCategory: editingFood.subCategory,
        rarity: (editingFood.rarity || 'THƯỜNG').toUpperCase(),
        isVegetarian: Boolean(editingFood.isVegetarian),
        rating: Number(editingFood.rating ?? 4.8),
        imageUrl: editingFood.imageUrl || '',
        description: editingFood.description || '',
        restaurantName:
          editingFood.restaurantName || editingFood.restaurant?.name || 'Quán Ngon Sài Gòn',
        restaurantAddress:
          editingFood.restaurantAddress || editingFood.restaurant?.address || 'TP. Hồ Chí Minh',
        lat: Number(editingFood.lat ?? editingFood.restaurant?.lat ?? 10.7769),
        lng: Number(editingFood.lng ?? editingFood.restaurant?.lng ?? 106.7009),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editingFood]);

  if (!open) return null;

  const isEdit = Boolean(editingFood);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim()) {
      setErrorMsg('Vui lòng nhập tên món ăn.');
      return;
    }
    if (!form.mainGroup.trim() || !form.subCategory.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Nhóm bữa ăn và Danh mục phụ.');
      return;
    }
    if (Number(form.price) < 0) {
      setErrorMsg('Giá món ăn không được nhỏ hơn 0.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(form);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể lưu món ăn.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#1E1E1E] border border-[#D4AF37]/35 shadow-luxury overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#171717] border-b border-[#D4AF37]/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? `Chỉnh sửa Món ăn (${editingFood?.id})` : 'Thêm Món ăn Mới'}
              </h2>
              <p className="text-xs text-neutral-400">
                {isEdit
                  ? 'Gửi PUT /api/foods/:id để cập nhật trực tiếp lên máy chủ'
                  : 'Gửi POST /api/foods để thêm vào kho Gacha Ẩm thực'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-2 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 px-4 py-3 text-sm text-rose-200">
              {errorMsg}
            </div>
          )}

          {/* Preview Banner */}
          <div className="rounded-2xl bg-[#141414] border border-white/10 p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-[#1E1E1E] border border-[#D4AF37]/25 overflow-hidden flex items-center justify-center shrink-0">
              {form.imageUrl && !imgError ? (
                <img
                  src={form.imageUrl}
                  alt={form.name || 'Preview'}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-neutral-600" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <RarityBadge rarity={form.rarity} showRate />
                {form.isVegetarian && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    <Leaf className="w-3 h-3" />
                    MÓN CHAY
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white truncate">
                {form.name.trim() || 'Tên món ăn sẽ hiển thị tại đây'}
              </h3>
              <p className="text-sm font-bold text-[#D4AF37]">
                {formatVND(Number(form.price) || 0)} •{' '}
                <span className="text-neutral-400 font-normal">
                  {form.mainGroup} / {form.subCategory}
                </span>
              </p>
            </div>
          </div>

          {/* Grid Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Tên món ăn <span className="text-[#D4AF37]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Phở bò Wagyu thượng hạng"
                className="luxury-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Mã ID món ăn {isEdit ? '(Cố định)' : '(Tùy chọn - Để trống tự sinh)'}
              </label>
              <input
                type="text"
                disabled={isEdit}
                value={form.id || ''}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="VD: food_366"
                className="luxury-input disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Giá tham khảo (VNĐ) <span className="text-[#D4AF37]">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="luxury-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Điểm đánh giá (0.0 – 5.0)
              </label>
              <div className="relative">
                <Star className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  className="luxury-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nhóm chính (mainGroup) <span className="text-[#D4AF37]">*</span>
              </label>
              <input
                type="text"
                list="mainGroupOptions"
                required
                value={form.mainGroup}
                onChange={(e) => setForm({ ...form, mainGroup: e.target.value })}
                placeholder="Chọn hoặc nhập nhóm chính..."
                className="luxury-input"
              />
              <datalist id="mainGroupOptions">
                {DEFAULT_MAIN_GROUPS.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Danh mục phụ (subCategory) <span className="text-[#D4AF37]">*</span>
              </label>
              <input
                type="text"
                list="subCategoryOptions"
                required
                value={form.subCategory}
                onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                placeholder="VD: Bún, phở & mì"
                className="luxury-input"
              />
              <datalist id="subCategoryOptions">
                {DEFAULT_SUB_CATEGORIES.map((sub) => (
                  <option key={sub} value={sub} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Rarity Selector (5 Tiers) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Bậc Độ hiếm Gacha (`THƯỜNG` → `CỔ VẬT`) <span className="text-[#D4AF37]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {RARITY_ORDER.map((tier) => {
                const meta = RARITY_CONFIG[tier];
                const selected = form.rarity.toUpperCase() === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setForm({ ...form, rarity: tier })}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                      selected
                        ? `${meta.bgClass} ${meta.borderClass} ring-2 ring-[#D4AF37]/40`
                        : 'bg-[#141414] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <p
                      className="text-xs font-extrabold tracking-wide"
                      style={{ color: selected ? meta.color : '#E5E7EB' }}
                    >
                      {tier}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Tỷ lệ: {meta.dropRate}%
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image & Vegetarian */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                URL Hình ảnh món ăn
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => {
                  setImgError(false);
                  setForm({ ...form, imageUrl: e.target.value });
                }}
                placeholder="https://images.unsplash.com/..."
                className="luxury-input"
              />
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl bg-[#141414] border border-white/10 px-4 py-2.5 cursor-pointer hover:border-[#D4AF37]/40 transition-colors">
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                <Leaf className="w-4 h-4 text-emerald-400" />
                Món Chay
              </span>
              <input
                type="checkbox"
                checked={form.isVegetarian}
                onChange={(e) => setForm({ ...form, isVegetarian: e.target.checked })}
                className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Mô tả hương vị
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn gọn nguyên liệu, hương vị đặc trưng của món ăn..."
              className="luxury-input resize-none"
            />
          </div>

          {/* Restaurant Details */}
          <div className="rounded-2xl bg-[#161616] border border-white/10 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              <Store className="w-4 h-4" />
              Thông tin Địa điểm Quán ăn gợi ý
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Tên nhà hàng / quán ăn
                </label>
                <input
                  type="text"
                  value={form.restaurantName}
                  onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                  className="luxury-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Địa chỉ quán
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={form.restaurantAddress}
                    onChange={(e) => setForm({ ...form, restaurantAddress: e.target.value })}
                    className="luxury-input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Vĩ độ (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })}
                  className="luxury-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Kinh độ (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })}
                  className="luxury-input"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
            >
              Hủy bỏ
            </button>
            <button type="submit" disabled={submitting} className="luxury-btn-gold">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Cập nhật Món ăn' : 'Thêm Món ăn'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
