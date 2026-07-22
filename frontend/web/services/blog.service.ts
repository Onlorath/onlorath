import { api } from './client';
import { Blog, BlogImage } from '@/types';

export const blogAPI = {
  list: () =>
    api.get<Blog[]>('/api/v1/blogs'),
  
  getBySlug: (slug: string) =>
    api.get<Blog>(`/api/v1/blogs/${slug}`),
};

export const adminBlogAPI = {
  list: () =>
    api.get<Blog[]>('/api/v1/admin/blogs'),
  
  getById: (id: string) =>
    api.get<Blog>(`/api/v1/admin/blogs/${id}`),
  
  create: (data: { title: string; content: string; cover_image?: string; published?: boolean }) =>
    api.post<Blog>('/api/v1/admin/blogs', data),
  
  update: (id: string, data: { title?: string; content?: string; cover_image?: string; published?: boolean }) =>
    api.put<Blog>(`/api/v1/admin/blogs/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/api/v1/admin/blogs/${id}`),
  
  addImage: (blogId: string, data: { url: string; alt_text?: string }) =>
    api.post<BlogImage>(`/api/v1/admin/blogs/${blogId}/images`, data),
  
  listImages: (blogId: string) =>
    api.get<BlogImage[]>(`/api/v1/admin/blogs/${blogId}/images`),
  
  deleteImage: (imageId: string) =>
    api.delete(`/api/v1/admin/blogs/images/${imageId}`),
};
