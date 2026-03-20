import type { ApiResponse } from "@/shared/types";
import { useAuthStore } from "@/lib/stores/authStore";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function fetchAPI<T>(
  endpoint: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {} } = options;

  const token = useAuthStore.getState().token;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      await useAuthStore.getState().logout();
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "인증이 만료되었습니다. 다시 로그인해주세요.",
          statusCode: 401,
        },
      };
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: "UNKNOWN_ERROR",
          message: "알 수 없는 오류가 발생했습니다.",
          statusCode: response.status,
        },
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "네트워크 연결을 확인해주세요.",
        statusCode: 0,
      },
    };
  }
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    fetchAPI<T>(endpoint, { method: "GET", headers }),

  post: <T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ) => fetchAPI<T>(endpoint, { method: "POST", body, headers }),

  put: <T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ) => fetchAPI<T>(endpoint, { method: "PUT", body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    fetchAPI<T>(endpoint, { method: "DELETE", headers }),
};
