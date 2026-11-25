import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  CheckCircle2,
  Database,
  FileJson,
  FolderUp,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { normalizeMainGroup } from '../constants/rarity';
import { Food, FoodFormData, RawFoodImportItem } from '../types';
import { foodService } from '../services/api';
import { extractErrorMessage } from '../lib/axios';

interface ImportFoodsModalProps {
  open: boolean;
  existingFoods: Food[];
  onClose: () => void;
  onImported: () => Promise<void>;
}

function normalizeRawItem(raw: RawFoodImportItem, index: number): FoodFormData {
  return {
    id: raw.id?.trim() || `food_${String(index + 1).padStart(3, '0')}`,
    name: String(raw.name || '').trim(),
    price: Number(raw.price) || 0,
    mainGroup: normalizeMainGroup(raw.mainGroup),
    subCategory: String(raw.subCategory || 'Khác').trim(),
    rarity: String(raw.rarity || 'THƯỜNG').trim().toUpperCase(),
    isVegetarian: Boolean(raw.isVegetarian),
    rating: Number(raw.rating ?? 4.8),
    imageUrl: String(raw.imageUrl || '').trim(),
    description: String(raw.description || '').trim(),
    restaurantName:
      raw.restaurantName?.trim() || raw.restaurant?.name?.trim() || 'Quán Ngon Sài Gòn',
    restaurantAddress:
      raw.restaurantAddress?.trim() || raw.restaurant?.address?.trim() || 'TP. Hồ Chí Minh',
    lat: Number(raw.lat ?? raw.restaurant?.lat ?? 10.7769),
    lng: Number(raw.lng ?? raw.restaurant?.lng ?? 106.7009),
  };
}

export const ImportFoodsModal: React.FC<ImportFoodsModalProps> = ({
  open,
  existingFoods,
  onClose,
  onImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<FoodFormData[]>([]);
  const [mode, setMode] = useState<'new-only' | 'upsert-all'>('new-only');
  const [loadingSample, setLoadingSample] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({
    done: 0,
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedNote, setCompletedNote] = useState<string | null>(null);

  const existingIdSet = useMemo(
    () => new Set(existingFoods.map((f) => f.id)),
    [existingFoods]
  );

  const summary = useMemo(() => {
    let newCount = 0;
    let existingCount = 0;
    for (const item of parsedItems) {
      if (item.id && existingIdSet.has(item.id)) {
        existingCount++;
      } else {
        newCount++;
      }
    }
    return { total: parsedItems.length, newCount, existingCount };
  }, [parsedItems, existingIdSet]);

  if (!open) return null;

  const parseJsonText = (text: string, label: string) => {
    setErrorMsg(null);
    setCompletedNote(null);
    try {
      const json = JSON.parse(text);
      const list: RawFoodImportItem[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.foods)
        ? json.foods
        : Array.isArray(json?.data)
        ? json.data
        : null;

      if (!list || !Array.isArray(list)) {
        throw new Error('File JSON phải là mảng các món ăn (ví dụ cấu trúc chuẩn của foods.json).');
      }

      const valid = list
        .map((item, idx) => normalizeRawItem(item, idx))
        .filter((item) => item.name.length > 0);

      if (valid.length === 0) {
        throw new Error('Không tìm thấy món ăn hợp lệ nào trong file JSON.');
      }

      setSourceLabel(label);
      setParsedItems(valid);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Định dạng JSON không hợp lệ.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    parseJsonText(content, file.name);
    e.target.value = '';
  };

  const handleLoadBuiltInFoodsJson = async () => {
    try {
      setLoadingSample(true);
      setErrorMsg(null);
      const res = await fetch('/foods.json');
      if (!res.ok) {
        throw new Error('Không thể tải file /foods.json mẫu.');
      }
      const text = await res.text();
      parseJsonText(text, 'foods.json (Bộ 365 món chuẩn)');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi đọc foods.json.');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleStartImport = async () => {
    if (parsedItems.length === 0) return;

    setErrorMsg(null);
    setCompletedNote(null);

    const targets =
      mode === 'new-only'
        ? parsedItems.filter((item) => !item.id || !existingIdSet.has(item.id))
        : parsedItems;

    const skippedInitial = parsedItems.length - targets.length;

    if (targets.length === 0) {
      setCompletedNote(
        `Tất cả ${parsedItems.length} món trong "${sourceLabel}" đều đã có sẵn trong cơ sở dữ liệu (0 món mới cần thêm). Bạn có thể chuyển sang chế độ "Cập nhật ghi đè" nếu muốn đồng bộ lại thông tin.`
      );
      return;
    }

    setImporting(true);
    setProgress({
      done: 0,
      total: targets.length,
      created: 0,
      updated: 0,
      skipped: skippedInitial,
      failed: 0,
    });

    let created = 0;
    let updated = 0;
    let failed = 0;
    let hitRateLimit = false;

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      const exists = Boolean(item.id && existingIdSet.has(item.id));

      try {
        if (exists && item.id) {
          await foodService.updateFood(item.id, item);
          updated++;
        } else {
          await foodService.createFood(item);
          created++;
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409 && item.id) {
          // Trường hợp trùng ID phát sinh thì cập nhật luôn
          try {
            await foodService.updateFood(item.id, item);
            updated++;
          } catch {
            failed++;
          }
        } else if (axios.isAxiosError(err) && err.response?.status === 429) {
          hitRateLimit = true;
          failed += targets.length - i;
          setErrorMsg(
            `Máy chủ giới hạn tần suất (Rate Limit 100 req/15 phút): Đã xử lý ${i}/${targets.length} món. Vui lòng đợi ít phút để tiếp tục phần còn lại.`
          );
          break;
        } else {
          failed++;
          if (failed === 1) {
            setErrorMsg(extractErrorMessage(err));
          }
        }
      }

      setProgress({
        done: i + 1,
        total: targets.length,
        created,
        updated,
        skipped: skippedInitial,
        failed,
      });
    }

    await onImported();
    setImporting(false);

    if (!hitRateLimit) {
      setCompletedNote(
        `Hoàn tất Import: Thêm mới ${created} món, cập nhật ${updated} món, bỏ qua ${skippedInitial} món đã tồn tại${
          failed > 0 ? `, lỗi ${failed} món` : ''
        }.`
      );
    }
  };

  const percent =
    progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-[#1E1E1E] border border-[#D4AF37]/35 shadow-luxury overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#171717] border-b border-[#D4AF37]/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Import Hàng loạt từ file <code className="text-[#D4AF37]">foods.json</code>
              </h2>
              <p className="text-xs text-neutral-400">
                Tải file JSON từ máy tính hoặc nạp trực tiếp bộ dữ liệu chuẩn 365 món ăn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="rounded-xl p-2 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* File Picker + Quick Built-in foods.json */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D4AF37]/40 bg-[#141414] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] p-5 text-center transition-all"
            >
              <FolderUp className="w-7 h-7 text-[#D4AF37]" />
              <div>
                <p className="text-sm font-bold text-white">Chọn file `foods.json` từ máy</p>
                <p className="text-xs text-neutral-400 mt-0.5">Hỗ trợ mọi tệp .json chuẩn mảng món ăn</p>
              </div>
            </button>

            <button
              type="button"
              disabled={importing || loadingSample}
              onClick={handleLoadBuiltInFoodsJson}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/30 bg-[#161616] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] p-5 text-center transition-all"
            >
              {loadingSample ? (
                <Loader2 className="w-7 h-7 text-[#D4AF37] animate-spin" />
              ) : (
                <Sparkles className="w-7 h-7 text-[#D4AF37]" />
              )}
              <div>
                <p className="text-sm font-bold text-[#F3D573]">Nạp nhanh `foods.json` (365 món)</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Đọc bộ dữ liệu gốc đồng bộ với Backend
                </p>
              </div>
            </button>
          </div>

          {/* Parsed File Summary */}
          {parsedItems.length > 0 && (
            <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-4 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
                  <Database className="w-4 h-4 text-[#D4AF37]" />
                  Nguồn đã chọn: <span className="text-[#D4AF37]">{sourceLabel}</span>
                </span>
                <span className="text-xs font-semibold text-neutral-400">
                  Tổng {summary.total} món hợp lệ
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-[#1E1E1E] p-3 border border-white/5">
                  <p className="text-lg font-extrabold text-white">{summary.total}</p>
                  <p className="text-[11px] text-neutral-400">Trong file JSON</p>
                </div>
                <div className="rounded-xl bg-[#1E1E1E] p-3 border border-emerald-500/25">
                  <p className="text-lg font-extrabold text-emerald-400">{summary.newCount}</p>
                  <p className="text-[11px] text-neutral-400">Món mới chưa có</p>
                </div>
                <div className="rounded-xl bg-[#1E1E1E] p-3 border border-[#D4AF37]/25">
                  <p className="text-lg font-extrabold text-[#D4AF37]">{summary.existingCount}</p>
                  <p className="text-[11px] text-neutral-400">Đã có sẵn ID</p>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                    mode === 'new-only'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]'
                      : 'bg-[#1A1A1A] border-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={mode === 'new-only'}
                    onChange={() => setMode('new-only')}
                    disabled={importing}
                    className="mt-1 accent-[#D4AF37]"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">Chỉ thêm món chưa có (Khuyên dùng)</p>
                    <p className="text-[11px] text-neutral-400">
                      Bỏ qua món trùng ID, tránh gọi thừa API
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                    mode === 'upsert-all'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]'
                      : 'bg-[#1A1A1A] border-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={mode === 'upsert-all'}
                    onChange={() => setMode('upsert-all')}
                    disabled={importing}
                    className="mt-1 accent-[#D4AF37]"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">Cập nhật & Ghi đè toàn bộ</p>
                    <p className="text-[11px] text-neutral-400">
                      POST món mới và PUT cập nhật món đã tồn tại
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {(importing || progress.total > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-semibold">
                  Tiến độ xử lý: {progress.done}/{progress.total} ({percent}%)
                </span>
                <span className="text-[#D4AF37] font-semibold">
                  +{progress.created} mới • ↻{progress.updated} cập nhật
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#121212] overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3D573] transition-all duration-200"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          {completedNote && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-4 py-3 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{completedNote}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 px-4 py-3 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={importing || parsedItems.length === 0}
              onClick={handleStartImport}
              className="luxury-btn-gold"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang Import...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Thực thi Import ngay
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
