import api from "@/lib/api";

export interface ProductPayload {
  name: string;
  desc: string;
  price: number;
  amount: number;
  unit: string;
  branchId: string;
  productCategoryId: string;
}

export interface ProductUpdatePayload {
  name?: string;
  desc?: string;
  price?: number;
  productCategoryId?: string;
}

export const productService = {
  getByBranch: (branchId: string) =>
    api.get(`/product/all/manager/${branchId}`),

  getAll: () => api.get("/product/all"),

  create: (data: ProductPayload) => api.post("/product", data),

  update: (id: string, data: ProductUpdatePayload) =>
    api.put(`/product/${id}`, data),

  toggleStatus: (id: string) => api.patch(`/product/status/${id}`),

  delete: (id: string) => api.delete(`/product/${id}`),
};
