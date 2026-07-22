'use client';

import React, { useState, useEffect } from 'react';
import { adminBlogAPI } from '@/services';
import { Blog } from '@/types';
import BlogForm from '@/features/blog/components/BlogForm';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function EditBlogPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      adminBlogAPI.getById(id)
        .then((res) => setBlog(res.data))
        .catch((err) => console.error('Failed to load blog details:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-8 text-center text-red-400 font-mono text-sm">
        Blog yazısı bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Blog Düzenle</h1>
        <p className="text-slate-400 mt-1.5 text-sm">Yazı detaylarını ve galeri görsellerini güncelleyin</p>
      </div>
      <BlogForm initialData={blog} isEdit={true} />
    </div>
  );
}
