export interface LocalizedText {
  tr: string;
  en: string;
}

export const PASTELS = ['coral', 'sky', 'butter', 'lavender', 'sage'] as const;
export type Pastel = (typeof PASTELS)[number];

export interface Profile {
  name: string;
  logo_text: string;
  hero_headline: LocalizedText;
  hero_lead: LocalizedText;
  role_title: LocalizedText;
  location_line: LocalizedText;
  about_title: LocalizedText;
  about_paragraphs: LocalizedText[];
  contact_lead: LocalizedText;
  email: string;
  footer_note: LocalizedText;
  cv_url: string;
  updated_at?: string;
}

export interface ProjectMeta {
  label: LocalizedText;
  value: LocalizedText;
  mono: boolean;
}

export interface ProjectAction {
  label: LocalizedText;
  url: string;
  variant: 'primary' | 'secondary';
}

export const MEDIA_TYPES = ['builtin', 'iframe', 'image', 'video', 'placeholder'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];
export const BUILTIN_GAMES = ['balloons'] as const;
export const PLACEHOLDER_ICONS = ['play', 'monitor', 'file', 'board', 'dollar', 'code', 'image'] as const;
export type PlaceholderIcon = (typeof PLACEHOLDER_ICONS)[number];

export interface ProjectMedia {
  type: MediaType;
  key?: string;
  url?: string;
  icon?: string;
  caption: LocalizedText;
  height?: number;
}

export type ProjectCategory = 'game' | 'software';

export interface ProjectInput {
  slug: string;
  published: boolean;
  category: ProjectCategory;
  color: Pastel;
  title: LocalizedText;
  platform: LocalizedText;
  status_label: LocalizedText;
  description: LocalizedText;
  meta: ProjectMeta[];
  actions: ProjectAction[];
  media: ProjectMedia;
  tech: string[];
}

export interface Project extends ProjectInput {
  id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  sort_order: number;
  period: LocalizedText;
  title: string;
  subtitle: LocalizedText;
  tag: LocalizedText;
  color: Pastel;
}
export type ExperienceInput = Omit<Experience, 'id' | 'sort_order'>;

export interface Skill {
  id: string;
  sort_order: number;
  label: string;
}

export interface SocialLink {
  id: string;
  sort_order: number;
  label: string;
  url: string;
}

export interface Site {
  profile: Profile;
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
  socials: SocialLink[];
}

export interface BlogInput {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: LocalizedText;
  cover_image: string;
  published: boolean;
}

export interface Blog extends BlogInput {
  id: string;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  locale: string;
  read: boolean;
  created_at: string;
}

export interface AdminStats {
  projects: number;
  blogs: number;
  blogs_published: number;
  unread_messages: number;
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
}

export interface ChatResponse {
  conversation_id: string;
  reply: string;
  title?: string;
}
