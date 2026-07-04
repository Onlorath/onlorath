'use client';

import React from 'react';
import BlogForm from '../../../../components/BlogForm';

export default function NewBlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Yeni Blog Yazısı</h1>
        <p className="text-slate-400 mt-1.5 text-sm">Yeni bir log kaydı oluşturun</p>
      </div>
      <BlogForm />
    </div>
  );
}
