import api from '@/lib/api';

export interface CategoryPayload {
  name: string;
  branchId: string;
  icon?: File;
}

export interface CategoryListParams {
  search?: string;
  offset?: number;
  limit?: number;
}

export const categoryService = {
  getByBranch: (branchId: string, params?: CategoryListParams) =>
    api.get(`/category/all/manager/${branchId}`, { params }),

  create: (data: CategoryPayload) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('branchId', data.branchId);
    if (data.icon) formData.append('icon', data.icon);
    return api.post('/category', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  toggleStatus: (id: string) => api.patch(`/category/status/${id}`),
};
