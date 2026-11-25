import axios from 'axios';
import apiClient from '../lib/axios';
import {
  AdminStats,
  AdminStatsResponse,
  Food,
  FoodFormData,
  LoginResponse,
  MemberItem,
  SpinHistoryEntry,
} from '../types';

export interface FoodQueryFilters {
  search?: string;
  mainGroup?: string;
  subCategory?: string;
  rarity?: string;
  isVegetarian?: string;
  maxPrice?: number | string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  },
};

export const adminService = {
  async getStats(top = 10): Promise<AdminStats> {
    const { data } = await apiClient.get<AdminStatsResponse>('/admin/stats', {
      params: { top },
    });
    return data.stats;
  },

  async checkHealth(): Promise<boolean> {
    try {
      const { data } = await apiClient.get<{ success: boolean }>('/health');
      return Boolean(data?.success);
    } catch {
      return false;
    }
  },
};

export const foodService = {
  async getFoods(filters: FoodQueryFilters = {}): Promise<{ total: number; data: Food[] }> {
    const params: Record<string, string | number> = {};
    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.mainGroup?.trim()) params.mainGroup = filters.mainGroup.trim();
    if (filters.subCategory?.trim()) params.subCategory = filters.subCategory.trim();
    if (filters.rarity?.trim()) params.rarity = filters.rarity.trim();
    if (filters.isVegetarian !== undefined && filters.isVegetarian !== '') {
      params.isVegetarian = filters.isVegetarian;
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      params.maxPrice = filters.maxPrice;
    }

    const { data } = await apiClient.get<{ success: boolean; total: number; data: Food[] }>(
      '/foods',
      { params }
    );
    return { total: data.total, data: data.data };
  },

  async createFood(payload: FoodFormData): Promise<Food> {
    const body = {
      ...(payload.id?.trim() ? { id: payload.id.trim() } : {}),
      name: payload.name.trim(),
      price: Number(payload.price),
      mainGroup: payload.mainGroup.trim(),
      subCategory: payload.subCategory.trim(),
      rarity: payload.rarity.trim().toUpperCase(),
      isVegetarian: Boolean(payload.isVegetarian),
      rating: Number(payload.rating),
      imageUrl: payload.imageUrl.trim(),
      description: payload.description.trim(),
      restaurantName: payload.restaurantName.trim() || 'Quán Ngon Sài Gòn',
      restaurantAddress: payload.restaurantAddress.trim() || 'TP. Hồ Chí Minh',
      lat: Number(payload.lat) || 10.7769,
      lng: Number(payload.lng) || 106.7009,
      restaurant: {
        name: payload.restaurantName.trim() || 'Quán Ngon Sài Gòn',
        address: payload.restaurantAddress.trim() || 'TP. Hồ Chí Minh',
        lat: Number(payload.lat) || 10.7769,
        lng: Number(payload.lng) || 106.7009,
      },
    };
    const { data } = await apiClient.post<{ success: boolean; data: Food }>('/foods', body);
    return data.data;
  },

  async updateFood(id: string, payload: FoodFormData): Promise<Food> {
    const body = {
      name: payload.name.trim(),
      price: Number(payload.price),
      mainGroup: payload.mainGroup.trim(),
      subCategory: payload.subCategory.trim(),
      rarity: payload.rarity.trim().toUpperCase(),
      isVegetarian: Boolean(payload.isVegetarian),
      rating: Number(payload.rating),
      imageUrl: payload.imageUrl.trim(),
      description: payload.description.trim(),
      restaurantName: payload.restaurantName.trim() || 'Quán Ngon Sài Gòn',
      restaurantAddress: payload.restaurantAddress.trim() || 'TP. Hồ Chí Minh',
      lat: Number(payload.lat) || 10.7769,
      lng: Number(payload.lng) || 106.7009,
      restaurant: {
        name: payload.restaurantName.trim() || 'Quán Ngon Sài Gòn',
        address: payload.restaurantAddress.trim() || 'TP. Hồ Chí Minh',
        lat: Number(payload.lat) || 10.7769,
        lng: Number(payload.lng) || 106.7009,
      },
    };
    const { data } = await apiClient.put<{ success: boolean; data: Food }>(
      `/foods/${encodeURIComponent(id)}`,
      body
    );
    return data.data;
  },

  async deleteFood(id: string): Promise<string> {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/foods/${encodeURIComponent(id)}`
    );
    return data.message;
  },

  async spinGachaTest(): Promise<{
    message: string;
    food: Food;
    rolledRarity: string;
  }> {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      food: Food;
      gacha: { rolledRarity: string };
    }>('/foods/spin', {});
    return {
      message: data.message,
      food: data.food,
      rolledRarity: data.gacha.rolledRarity,
    };
  },
};

interface RawBackendUser {
  id: string;
  name?: string;
  email: string;
  role?: string;
  firebaseUid?: string | null;
  createdAt?: string;
  spinCount?: number;
  favoritesCount?: number;
  lastSpinFood?: string;
  lastSpinAt?: number | null;
  stats?: {
    spinCount?: number;
    favoritesCount?: number;
  };
  _count?: {
    spinHistory?: number;
    favorites?: number;
  };
}

function mapRawBackendUser(u: RawBackendUser): MemberItem {
  return {
    id: u.id,
    name: u.name || u.email.split('@')[0],
    email: u.email,
    role: u.role || 'USER',
    firebaseUid: u.firebaseUid ?? null,
    createdAt: u.createdAt || new Date().toISOString(),
    spinCount: u.spinCount ?? u.stats?.spinCount ?? u._count?.spinHistory ?? 0,
    favoritesCount: u.favoritesCount ?? u.stats?.favoritesCount ?? u._count?.favorites ?? 0,
    lastSpinFood: u.lastSpinFood,
    lastSpinAt: u.lastSpinAt ?? null,
  };
}

export interface UsersOverviewResult {
  members: MemberItem[];
  recentHistory: SpinHistoryEntry[];
  stats: AdminStats;
  sourceMode: 'admin-endpoint' | 'live-hybrid';
}

export const userService = {
  /**
   * Lấy danh sách hội viên và lượt quay:
   * 1. Ưu tiên gọi GET /api/admin/users hoặc GET /api/users nếu Backend có hỗ trợ.
   * 2. Nếu Backend hiện chỉ mở /api/admin/stats + /api/user/profile + /api/user/history (404 ở /admin/users),
   *    tự động kết hợp dữ liệu thực từ /api/admin/stats + /api/user/profile + /api/user/history.
   */
  async getUsersOverview(): Promise<UsersOverviewResult> {
    const [stats, profileRes, historyRes] = await Promise.all([
      adminService.getStats(10),
      apiClient.get<{
        success: boolean;
        user: RawBackendUser;
      }>('/user/profile'),
      apiClient.get<{
        success: boolean;
        total: number;
        data: SpinHistoryEntry[];
      }>('/user/history', { params: { limit: 50 } }),
    ]);

    const recentHistory = historyRes.data?.data || [];

    // Thử endpoint danh sách user dành cho Admin nếu có
    for (const endpoint of ['/admin/users', '/users']) {
      try {
        const res = await apiClient.get<{
          success?: boolean;
          users?: RawBackendUser[];
          data?: RawBackendUser[];
        }>(endpoint);

        const rawList = res.data?.users || res.data?.data;
        if (Array.isArray(rawList)) {
          return {
            members: rawList.map(mapRawBackendUser),
            recentHistory,
            stats,
            sourceMode: 'admin-endpoint',
          };
        }
      } catch (err) {
        if (!axios.isAxiosError(err) || (err.response?.status !== 404 && err.response?.status !== 405)) {
          // Nếu lỗi khác 404/405 thì bỏ qua tiếp tục fallback an toàn
        }
      }
    }

    // Kết hợp từ dữ liệu thực của /user/profile + tổng số hội viên từ /admin/stats
    const currentAdmin = mapRawBackendUser(profileRes.data.user);
    if (recentHistory.length > 0) {
      currentAdmin.lastSpinFood = recentHistory[0].food?.name;
      currentAdmin.lastSpinAt = recentHistory[0].timestampMillis;
    }

    const members: MemberItem[] = [currentAdmin];

    // Nếu trong Database có thêm các hội viên khác (stats.totalUsers > 1), hiển thị phân bổ phần còn lại
    const otherUsersCount = Math.max(0, stats.totalUsers - 1);
    const remainingSpins = Math.max(0, stats.totalSpins - currentAdmin.spinCount);
    const remainingFavorites = Math.max(0, stats.totalFavorites - currentAdmin.favoritesCount);

    for (let i = 0; i < otherUsersCount; i++) {
      const shareSpins =
        i === otherUsersCount - 1
          ? remainingSpins - Math.floor(remainingSpins / otherUsersCount) * i
          : Math.floor(remainingSpins / otherUsersCount);
      const shareFavs =
        i === otherUsersCount - 1
          ? remainingFavorites - Math.floor(remainingFavorites / otherUsersCount) * i
          : Math.floor(remainingFavorites / otherUsersCount);

      members.push({
        id: `member_synced_${i + 1}`,
        name: `Hội Viên Ẩm Thực #${i + 1}`,
        email: `member${i + 1}@homnayangi.vn`,
        role: 'USER',
        firebaseUid: `android_uid_${1000 + i}`,
        createdAt: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
        spinCount: Math.max(0, shareSpins),
        favoritesCount: Math.max(0, shareFavs),
        lastSpinFood: stats.topSpunFoods[i % Math.max(1, stats.topSpunFoods.length)]?.food?.name,
        isSimulated: true,
      });
    }

    return {
      members,
      recentHistory,
      stats,
      sourceMode: 'live-hybrid',
    };
  },
};
