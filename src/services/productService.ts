import api from '@/lib/api';

export interface ProductPayload {
  name: string;
  desc: string;
  price: number;
  amount: number;
  unit: string;
  branchId: string;
  productCategoryId: string;
  photo?: File;
}

export const productService = {
  getByBranchManager: (branchId: string) =>
    api.get(`/product/all/manager/${branchId}`),

  getAll: () =>
    api.get('/product/all'),

  create: (data: ProductPayload) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('desc', data.desc);
    formData.append('price', String(data.price));
    formData.append('amount', String(data.amount));
    formData.append('unit', data.unit);
    formData.append('branchId', data.branchId);
    formData.append('productCategoryId', data.productCategoryId);
    if (data.photo) formData.append('photo', data.photo);
    return api.post('/product', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  toggleStatus: (id: string) => api.patch(`/product/status/${id}`),

  delete: (id: string) => api.delete(`/product/${id}`),
};
