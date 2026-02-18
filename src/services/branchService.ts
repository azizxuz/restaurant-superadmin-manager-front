import api from "@/lib/api";

export interface BranchPayload {
  name: string;
  addres: string;
  companyId?: string;
  kpi: number; // ✅ Afitsant uchun xizmat ulushi foizi (%)
}

export interface BranchResponse {
  id: string;
  name: string;
  addres: string;
  companyId: string;
  kpi: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const branchService = {
  getById: (id: string) => api.get(`/branch/${id}`),

  getAll: () => api.get(`/branch/my`),

  create: (data: BranchPayload) => api.post("/branch/", data),

  update: (id: string, data: BranchPayload) => api.patch(`/branch/${id}`, data),

  toggleStatus: (id: string) => api.patch(`/branch/sattus/${id}`),

  delete: (id: string) => api.delete(`/branch/${id}`),
};
