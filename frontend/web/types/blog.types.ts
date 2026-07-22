export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string;
  author_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogImage {
  id: string;
  blog_id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  created_at: string;
}
