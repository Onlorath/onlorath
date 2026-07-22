export interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  status: string;
  cover_image: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  created_at: string;
}
