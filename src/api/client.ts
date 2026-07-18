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

// Backend error envelope is FLAT: `{ error: "human message", ...extra }` —
// e.g. verification's already-active 409 carries a sibling `cycleId` field.
// `error` is a plain string, never a nested object (see regix360-backend
// src/shared/errors.js `errorHandler`, the one place errors become HTTP).
export type ApiError = {
  name: string;
  message: string;
} & Record<string, unknown>;

export function throwError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<Record<string, unknown> & { error?: string }>;
    const { error: message, ...extra } = axiosError.response?.data ?? {};
    throw {
      name: "ApiError",
      message: (message as string | undefined) ?? axiosError.message ?? "Something went wrong.",
      ...extra,
    } satisfies ApiError;
  }
  throw {
    name: "ApiError",
    message: "Something went wrong.",
    details: error,
  } satisfies ApiError;
}
