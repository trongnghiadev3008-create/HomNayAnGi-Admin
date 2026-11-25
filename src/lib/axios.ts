import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const TOKEN_STORAGE_KEY = 'token';
export const USER_STORAGE_KEY = 'admin_user';

const rawApiUrl =
  import.meta.env.VITE_API_URL || 'https://homnayangi-backend.onrender.com/api';

export const API_BASE_URL = rawApiUrl.trim().replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Tăng timeout lên 45s để tương thích tốt khi Render Free Tier khởi động lại (cold start)
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * - Chống lặp '/api/api/' nếu baseURL đã kết thúc bằng '/api'
 * - Tự động đọc JWT token từ localStorage và đính kèm Authorization: Bearer <token>
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url && API_BASE_URL.endsWith('/api') && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * Xử lý tập trung lỗi 401 (hết hạn / sai JWT) và chuẩn hóa thông báo lỗi tiếng Việt
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Array<{ message?: string }> }>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    if (status === 401 && !requestUrl.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('hnag:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown, fallback = 'Đã xảy ra lỗi kết nối máy chủ.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Array<{ field?: string; message?: string }> }
      | undefined;

    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((e) => e.message).filter(Boolean).join(' • ');
    }
    if (data?.message) {
      return data.message;
    }
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
      return `Không thể kết nối tới Backend API (${API_BASE_URL}). Nếu server Render đang ngủ (cold start), vui lòng thử lại sau vài giây.`;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export default apiClient;
