import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { Food } from '../types';
import { formatVND } from '../constants/rarity';
import { RarityBadge } from './RarityBadge';

interface ConfirmDeleteModalProps {
  food: Food | null;
  onClose: () => void;
  onConfirm: (food: Food) => Promise<void>;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  food,
  onClose,
  onConfirm,
}) => {
  const [deleting, setDeleting] = useState(false);

  if (!food) return null;

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm(food);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#1E1E1E] border border-rose-500/35 shadow-luxury overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Xác nhận xóa món ăn?</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Thao tác này sẽ gọi <code className="text-rose-300">DELETE /api/foods/{food.id}</code>{' '}
              và xóa vĩnh viễn món ăn khỏi hệ thống.
            </p>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-white/10 p-3.5 flex items-center gap-3">
            {food.imageUrl && (
              <img
                src={food.imageUrl}
                alt={food.name}
                className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{food.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <RarityBadge rarity={food.rarity} />
                <span className="text-xs font-semibold text-[#D4AF37]">
                  {formatVND(food.price)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
            >
              Giữ lại
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Xóa vĩnh viễn
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
