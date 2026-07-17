import axios, { AxiosError } from "axios";
import { deleteCookie, getCookie } from "cookies-next";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
export const TOKEN_COOKIE = "token";

export const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use((config) => {
  const token = getCookie(TOKEN_COOKIE);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["x-source"] = "web";
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined") {
      deleteCookie(TOKEN_COOKIE);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export type ApiError = {
  name: string;
  message: string;
  details?: unknown;
};

export function throwError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { message?: string; details?: unknown } }>;
    const payload = axiosError.response?.data?.error;
    throw {
      name: "ApiError",
      message: payload?.message ?? axiosError.message ?? "Something went wrong.",
      details: payload?.details,
    } satisfies ApiError;
  }
  throw {
    name: "ApiError",
    message: "Something went wrong.",
    details: error,
  } satisfies ApiError;
}
