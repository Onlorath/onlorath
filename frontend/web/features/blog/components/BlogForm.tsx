'use client';

import React, { useState, useEffect } from 'react';
import { adminBlogAPI, uploadAPI } from '@/services';
import { Blog, BlogImage } from '@/types';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface BlogFormProps {
  initialData?: Blog;
  isEdit?: boolean;
}

export default function BlogForm({ initialData, isEdit = false }: BlogFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [published, setPublished] = useState(initialData?.published || false);
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || '');
  const [gallery, setGallery] = useState<BlogImage[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    if (isEdit && initialData) {
      adminBlogAPI.listImages(initialData.id)
        .then((res) => setGallery(res.data || []))
        .catch((err) => console.error('Failed to load gallery:', err));
    }
  }, [isEdit, initialData]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const res = await uploadAPI.upload(file);
      setCoverImage(res.data.url);
    } catch (err) {
      alert('Resim yüklenemedi.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !initialData) return;

    setUploadingGallery(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadRes = await uploadAPI.upload(file);
        const imgRes = await adminBlogAPI.addImage(initialData.id, {
          url: uploadRes.data.url,
          alt_text: title + ' galeri resmi',
        });
        setGallery((prev) => [...prev, imgRes.data]);
      }
    } catch (err) {
      alert('Görseller yüklenirken hata oluştu.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await adminBlogAPI.deleteImage(id);
      setGallery(gallery.filter((img) => img.id !== id));
    } catch (err) {
      alert('Resim silinemedi.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('Başlık zorunludur.');

    setSaving(true);
    try {
      if (isEdit && initialData) {
        await adminBlogAPI.update(initialData.id, {
          title,
          content,
          cover_image: coverImage,
          published,
        });
        router.push('/admin/blogs');
      } else {
        const res = await adminBlogAPI.create({
          title,
          content,
          cover_image: coverImage,
          published,
        });
        router.push(`/admin/blogs/${res.data.id}/edit`);
      }
    } catch (err) {
      alert('Kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <Link
          href="/admin/blogs"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Geri Dön
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Kaydet
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/20 border border-white/5 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Başlık</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Yazı başlığını girin..."
                className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">İçerik (Markdown)</label>
              <textarea
                rows={15}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="İçerik markdown formatında yazılabilir..."
                className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-y"
              />
            </div>
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-6">
          {/* Cover & Publishing status */}
          <div className="bg-slate-900/20 border border-white/5 p-6 rounded-2xl backdrop-blur-md space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kapak Resmi</label>
              {coverImage ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 group mb-3">
                  <img src={coverImage} alt="Kapak" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600/80 text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 cursor-pointer hover:border-slate-700 transition-all">
                  <div className="text-center space-y-1">
                    {uploadingCover ? (
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-650 mx-auto" />
                        <div className="text-xs text-slate-400">Resim Seç (Max 5MB)</div>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} />
                </label>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 bg-slate-950 border border-slate-800 rounded text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="published" className="text-sm font-semibold text-slate-350 cursor-pointer select-none">
                Yayınla (Herkese Açık)
              </label>
            </div>
          </div>

          {/* Gallery management (Only in edit mode) */}
          {isEdit && (
            <div className="bg-slate-900/20 border border-white/5 p-6 rounded-2xl backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Görsel Galerisi</label>
                <label className="cursor-pointer text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-all">
                  {uploadingGallery ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : (
                    'Ekle +'
                  )}
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} disabled={uploadingGallery} />
                </label>
              </div>

              {(gallery || []).length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
                  <ImageIcon className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                  Galeri boş.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(gallery || []).map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-white/5">
                      <img src={img.url} alt="Galeri resmi" className="w-full h-20 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute top-1 right-1 p-1 rounded bg-black/60 hover:bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
