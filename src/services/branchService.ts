import api from "@/lib/api";

export interface BranchPayload {
  name: string;
  addres: string; // ✅ Backend "addres" kutadi (typo bor backendda)
  companyId?: string; // ✅ Optional qilamiz
}

export interface BranchResponse {
  id: string;
  name: string;
  addres: string;
  companyId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const branchService = {
  getById: (id: string) => api.get(`/branch/${id}`),

  getAll: () => api.get(`/branch/my`), // ✅ To'g'ri endpoint

  create: (data: BranchPayload) => api.post("/branch/", data),

  update: (id: string, data: BranchPayload) => api.patch(`/branch/${id}`, data),

  toggleStatus: (id: string) => api.patch(`/branch/sattus/${id}`),

  delete: (id: string) => api.delete(`/branch/${id}`),
};
