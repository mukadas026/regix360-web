import axios, { AxiosError } from "axios";
import { getCookie } from "cookies-next";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use((config) => {
  const token = getCookie("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["x-source"] = "web";
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
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
