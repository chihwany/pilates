import { api } from "./client";
import type { Member } from "@/shared/types";

export async function getMembers(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get<Member[]>(`/members${query}`);
}

export async function getMember(id: string) {
  return api.get<Member>(`/members/${id}`);
}
