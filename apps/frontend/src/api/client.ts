import axios, { AxiosInstance, AxiosResponse } from "axios";

// ─── API base URL ─────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:3001";

// ─── Axios instance ───────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor – log in development only
apiClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor – unified error logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV === "development") {
      if (error.response) {
        console.error(
          `[API Error] ${error.response.status}`,
          error.response.data,
        );
      } else {
        console.error("[API Error] No response", error.message);
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// ─── Types ───────────────────────────────────────────────────────────────────

export type RoomStatus = "可用" | "已入住" | "已预订" | "清洁中" | "维修中";
export type RoomType = "标准间" | "豪华间" | "套房" | "总统套房";

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  floor: number;
  status: RoomStatus;
  price: number;
  capacity: number;
  amenities: string[];
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  idCard: string;
  gender: "男" | "女" | "其他";
  address: string;
  memberLevel: "普通" | "银卡" | "金卡" | "钻石";
  totalStays: number;
  totalSpent: number;
  createdAt: string;
  lastStayDate: string;
}

export interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  roomNumber: string;
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  status: "待确认" | "已确认" | "已入住" | "已退房" | "已取消";
  totalPrice: number;
  specialRequests: string;
  createdAt: string;
}

// ─── Typed API helpers ────────────────────────────────────────────────────────

/** Wraps an axios call so callers get `AxiosResponse<T>` */
type ApiCall<T = unknown> = () => Promise<AxiosResponse<T>>;

export const api = {
  // Health
  health: (): ReturnType<ApiCall<{ status: string; message: string }>> =>
    apiClient.get("/health"),

  // Rooms
  getRooms: (): ReturnType<ApiCall<Room[]>> => apiClient.get("/api/rooms"),
  getRoom: (id: string) => apiClient.get(`/api/rooms/${id}`),
  createRoom: (data: unknown) => apiClient.post("/api/rooms", data),
  updateRoom: (id: string, data: unknown) =>
    apiClient.put(`/api/rooms/${id}`, data),
  deleteRoom: (id: string) => apiClient.delete(`/api/rooms/${id}`),

  // Bookings
  getBookings: (): ReturnType<ApiCall<Booking[]>> => apiClient.get("/api/bookings"),
  getBooking: (id: string) => apiClient.get(`/api/bookings/${id}`),
  createBooking: (data: unknown) => apiClient.post("/api/bookings", data),
  updateBooking: (id: string, data: unknown) =>
    apiClient.put(`/api/bookings/${id}`, data),
  cancelBooking: (id: string) => apiClient.put(`/api/bookings/${id}/cancel`),

  // Guests
  getGuests: (): ReturnType<ApiCall<Guest[]>> => apiClient.get("/api/guests"),
  getGuest: (id: string) => apiClient.get(`/api/guests/${id}`),
  createGuest: (data: unknown) => apiClient.post("/api/guests", data),
  updateGuest: (id: string, data: unknown) =>
    apiClient.put(`/api/guests/${id}`, data),
  deleteGuest: (id: string) => apiClient.delete(`/api/guests/${id}`),

  // Dashboard / Stats
  getDashboard: () => apiClient.get("/api/dashboard"),
  getStats: (range = "30d") => apiClient.get(`/api/stats?range=${range}`),
};