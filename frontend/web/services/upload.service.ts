import { api } from './client';

export const uploadAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string }>('/api/v1/admin/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  delete: (filename: string) =>
    api.delete(`/api/v1/admin/uploads/${filename}`),
};
