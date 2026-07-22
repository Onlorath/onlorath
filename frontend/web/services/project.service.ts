import { api } from './client';
import { Project, ProjectImage } from '@/types';

export const projectAPI = {
  list: () =>
    api.get<Project[]>('/api/v1/projects'),
  
  getById: (id: string) =>
    api.get<Project>(`/api/v1/projects/${id}`),
};

export const adminProjectAPI = {
  list: () =>
    api.get<Project[]>('/api/v1/admin/projects'),
  
  getById: (id: string) =>
    api.get<Project>(`/api/v1/admin/projects/${id}`),
  
  create: (data: { title: string; description: string; tech: string[]; status: string; cover_image?: string; sort_order?: number }) =>
    api.post<Project>('/api/v1/admin/projects', data),
  
  update: (id: string, data: { title?: string; description?: string; tech?: string[]; status?: string; cover_image?: string; sort_order?: number }) =>
    api.put<Project>(`/api/v1/admin/projects/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/api/v1/admin/projects/${id}`),
  
  addImage: (projectId: string, data: { url: string; alt_text?: string }) =>
    api.post<ProjectImage>(`/api/v1/admin/projects/${projectId}/images`, data),
  
  listImages: (projectId: string) =>
    api.get<ProjectImage[]>(`/api/v1/admin/projects/${projectId}/images`),
  
  deleteImage: (imageId: string) =>
    api.delete(`/api/v1/admin/projects/images/${imageId}`),
};
