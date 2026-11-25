import { RarityTier } from '../types';

export interface RarityMeta {
  tier: RarityTier;
  label: string;
  dropRate: number;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  glowColor: string;
}

/**
 * Thứ tự chuẩn 5 bậc độ hiếm từ THƯỜNG -> CỔ VẬT đồng bộ với Android Gacha Engine
 */
export const RARITY_ORDER: RarityTier[] = [
  'THƯỜNG',
  'HIẾM',
  'SỬ THI',
  'HUYỀN THOẠI',
  'CỔ VẬT',
];

export const RARITY_CONFIG: Record<RarityTier, RarityMeta> = {
  'THƯỜNG': {
    tier: 'THƯỜNG',
    label: 'Thường',
    dropRate: 55,
    color: '#9CA3AF',
    bgClass: 'bg-neutral-500/15',
    textClass: 'text-neutral-300',
    borderClass: 'border-neutral-400/35',
    glowColor: 'rgba(156, 163, 175, 0.25)',
  },
  'HIẾM': {
    tier: 'HIẾM',
    label: 'Hiếm',
    dropRate: 25,
    color: '#38BDF8',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-400/40',
    glowColor: 'rgba(56, 189, 248, 0.28)',
  },
  'SỬ THI': {
    tier: 'SỬ THI',
    label: 'Sử Thi',
    dropRate: 12,
    color: '#C084FC',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-400/40',
    glowColor: 'rgba(192, 132, 252, 0.28)',
  },
  'HUYỀN THOẠI': {
    tier: 'HUYỀN THOẠI',
    label: 'Huyền Thoại',
    dropRate: 6,
    color: '#D4AF37',
    bgClass: 'bg-[#D4AF37]/20',
    textClass: 'text-[#F3D573]',
    borderClass: 'border-[#D4AF37]/60',
    glowColor: 'rgba(212, 175, 55, 0.35)',
  },
  'CỔ VẬT': {
    tier: 'CỔ VẬT',
    label: 'Cổ Vật',
    dropRate: 2,
    color: '#FB7185',
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-400/55',
    glowColor: 'rgba(251, 113, 133, 0.38)',
  },
};

export function getRarityMeta(rarityRaw: string): RarityMeta {
  const normalized = (rarityRaw || 'THƯỜNG').toUpperCase().trim();
  if (normalized in RARITY_CONFIG) {
    return RARITY_CONFIG[normalized as RarityTier];
  }
  const aliasMap: Record<string, RarityTier> = {
    COMMON: 'THƯỜNG',
    RARE: 'HIẾM',
    EPIC: 'SỬ THI',
    LEGENDARY: 'HUYỀN THOẠI',
    MYTHIC: 'CỔ VẬT',
    ARTIFACT: 'CỔ VẬT',
  };
  return RARITY_CONFIG[aliasMap[normalized] || 'THƯỜNG'];
}

export const DEFAULT_MAIN_GROUPS = ['Bữa chính', 'Món nhậu', 'Ăn vặt', 'Đồ uống'];

export function normalizeMainGroup(raw?: string | null): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return 'Bữa chính';
  const upper = trimmed.toUpperCase();
  if (
    upper === 'ĂN TRƯA' ||
    upper === 'AN TRUA' ||
    upper === 'BỮA CHÍNH' ||
    upper === 'BUA CHINH' ||
    upper === 'LUNCH' ||
    upper === 'MAIN' ||
    upper === 'MAIN_MEAL'
  ) {
    return 'Bữa chính';
  }
  return trimmed;
}

export const DEFAULT_SUB_CATEGORIES = [
  'Bánh mì & cuốn',
  'Cơm & xôi',
  'Bún, phở & mì',
  'Lẩu & cháo',
  'Salad & món nhẹ',
  'Nướng & chiên',
  'Pizza & pasta',
  'Rau, đậu & lạc',
  'Món chiên',
  'Thịt & hải sản',
  'Trái cây & Ăn nhẹ',
  'Món ngọt',
  'Món mặn',
  'Soda & nước đóng chai',
  'Giải khát',
  'Trà & trà trái cây',
  'Cà phê',
  'Sữa & sữa hạt',
  'Sữa chua uống',
  'Trà sữa',
  'Matcha & cacao',
  'Sinh tố',
  'Nước ép',
  'Đá xay',
];

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
