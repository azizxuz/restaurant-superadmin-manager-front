import api from "@/lib/api";

export interface Kitchen {
  id: string;
  name: string;
  branchId: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface KitchenPayload {
  name: string;
  branchId: string;
}

export const kitchenService = {
  getAll: (branchId: string) =>
    api.get<Kitchen[]>(`/kitchen/all/manager/${branchId}`),

  create: (data: KitchenPayload) =>
    api.post<Kitchen>("/kitchen", data),

  update: (id: string, name: string) =>
    api.patch<Kitchen>(`/kitchen/${id}`, { name }),

  toggleStatus: (id: string) =>
    api.patch<Kitchen>(`/kitchen/status/${id}`),

  delete: (id: string) =>
    api.delete<Kitchen>(`/kitchen/${id}`),
};
