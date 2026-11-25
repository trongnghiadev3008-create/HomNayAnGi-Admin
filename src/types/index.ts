export type RarityTier = 'THƯỜNG' | 'HIẾM' | 'SỬ THI' | 'HUYỀN THOẠI' | 'CỔ VẬT';

export interface RestaurantInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Food {
  id: string;
  name: string;
  price: number;
  mainGroup: string;
  subCategory: string;
  rarity: string;
  isVegetarian: boolean;
  rating: number;
  imageUrl: string;
  description: string;
  restaurantName: string;
  restaurantAddress: string;
  lat: number;
  lng: number;
  restaurant?: RestaurantInfo;
}

export interface FoodFormData {
  id?: string;
  name: string;
  price: number;
  mainGroup: string;
  subCategory: string;
  rarity: string;
  isVegetarian: boolean;
  rating: number;
  imageUrl: string;
  description: string;
  restaurantName: string;
  restaurantAddress: string;
  lat: number;
  lng: number;
}

export interface RawFoodImportItem {
  id?: string;
  name: string;
  price: number;
  mainGroup: string;
  subCategory: string;
  rarity?: string;
  isVegetarian?: boolean;
  rating?: number;
  imageUrl?: string;
  description?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  lat?: number;
  lng?: number;
  restaurant?: {
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
}

export interface AuthUser {
  id: string;
  firebaseUid: string | null;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | string;
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface MainGroupStat {
  mainGroup: string;
  count: number;
}

export interface RarityStat {
  rarity: string;
  count: number;
}

export interface TopSpunFoodItem {
  spinCount: number;
  food: Food;
}

export interface AdminStats {
  totalFoods: number;
  totalUsers: number;
  totalSpins: number;
  totalFavorites: number;
  byMainGroup: MainGroupStat[];
  byRarity: RarityStat[];
  topSpunFoods: TopSpunFoodItem[];
}

export interface AdminStatsResponse {
  success: boolean;
  stats: AdminStats;
}

export interface SpinHistoryEntry {
  id: string;
  userId: string;
  foodId: string;
  timestampMillis: number;
  food: Food;
}

export interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | string;
  firebaseUid: string | null;
  createdAt: string;
  spinCount: number;
  favoritesCount: number;
  lastSpinFood?: string;
  lastSpinAt?: number | null;
  isSimulated?: boolean;
}
