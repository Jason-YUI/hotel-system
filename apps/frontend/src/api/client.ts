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

// ─── Typed API helpers ────────────────────────────────────────────────────────

/** Wraps an axios call so callers get `AxiosResponse<T>` */
type ApiCall<T = unknown> = () => Promise<AxiosResponse<T>>;

export const api = {
  // Health
  health: (): ReturnType<ApiCall<{ status: string; message: string }>> =>
    apiClient.get("/health"),

  // Rooms
  getRooms: (): ReturnType<ApiCall> => apiClient.get("/api/rooms"),
  getRoom: (id: string) => apiClient.get(`/api/rooms/${id}`),
  createRoom: (data: unknown) => apiClient.post("/api/rooms", data),
  updateRoom: (id: string, data: unknown) =>
    apiClient.put(`/api/rooms/${id}`, data),
  deleteRoom: (id: string) => apiClient.delete(`/api/rooms/${id}`),

  // Bookings
  getBookings: () => apiClient.get("/api/bookings"),
  getBooking: (id: string) => apiClient.get(`/api/bookings/${id}`),
  createBooking: (data: unknown) => apiClient.post("/api/bookings", data),
  updateBooking: (id: string, data: unknown) =>
    apiClient.put(`/api/bookings/${id}`, data),
  cancelBooking: (id: string) => apiClient.put(`/api/bookings/${id}/cancel`),

  // Guests
  getGuests: () => apiClient.get("/api/guests"),
  getGuest: (id: string) => apiClient.get(`/api/guests/${id}`),
  createGuest: (data: unknown) => apiClient.post("/api/guests", data),
  updateGuest: (id: string, data: unknown) =>
    apiClient.put(`/api/guests/${id}`, data),
  deleteGuest: (id: string) => apiClient.delete(`/api/guests/${id}`),

  // Dashboard / Stats
  getDashboard: () => apiClient.get("/api/dashboard"),
  getStats: (range = "30d") => apiClient.get(`/api/stats?range=${range}`),
};
