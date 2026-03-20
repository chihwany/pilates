import { api } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/shared/types";

export async function login(data: LoginRequest) {
  return api.post<AuthResponse>("/auth/login", data);
}

export async function register(data: RegisterRequest) {
  return api.post<AuthResponse>("/auth/register", data);
}

export async function getMe() {
  return api.get<User>("/auth/me");
}

export async function refreshToken(token: string) {
  return api.post<AuthResponse>("/auth/refresh", { refreshToken: token });
}
