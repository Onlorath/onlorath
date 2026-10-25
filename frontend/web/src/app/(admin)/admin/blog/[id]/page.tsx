'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BlogEditor } from '@/components/admin/BlogEditor';
import { errorMessage } from '@/components/admin/fields';
import styles from '@/components/admin/admin.module.css';
import { api } from '@/lib/api/client';
import type { Blog } from '@/lib/api/types';

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Blog>(`/admin/blogs/${id}`).then(setBlog, (e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <p className={styles.err}>{error}</p>;
  if (!blog) return <p className={styles.hint}>Yükleniyor…</p>;
  return <BlogEditor key={blog.id} initial={blog} />;
}
