'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'İsim alanı zorunludur.';
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-posta alanı zorunludur.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçersiz e-posta formatı.';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Mesaj alanı zorunludur.';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Mesajınız en az 10 karakter olmalıdır.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('sending');

    // Simulate sending message to backend API with a 1.2 second latency
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[350px] animate-fade-in">
        <CheckCircle className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white mb-2">Mesajınız İletildi</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Sistem mimarisi ve projeler hakkında gönderdiğiniz mesaj başarıyla kaydedildi. En kısa sürede geri dönüş yapacağım.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          Yeni Mesaj Gönder
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Send className="w-4 h-4 text-emerald-400" />
        Mesaj Gönder
      </h3>

      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 mb-4 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Mesaj gönderilirken hata oluştu. Lütfen tekrar deneyin.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            İsminiz
          </label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            disabled={status === 'sending'}
            className={`w-full bg-slate-950/80 border text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
              errors.name ? 'border-red-500/50' : 'border-slate-850'
            }`}
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            E-posta Adresiniz
          </label>
          <input
            type="email"
            name="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={status === 'sending'}
            className={`w-full bg-slate-950/80 border text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
              errors.email ? 'border-red-500/50' : 'border-slate-850'
            }`}
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Mesajınız
          </label>
          <textarea
            name="message"
            rows={4}
            placeholder="Proje veya iş birlikleri hakkında mesajınızı yazın..."
            value={formData.message}
            onChange={handleChange}
            disabled={status === 'sending'}
            className={`w-full bg-slate-950/80 border text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none ${
              errors.message ? 'border-red-500/50' : 'border-slate-850'
            }`}
          />
          {errors.message && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-2.5 rounded-lg text-sm shadow-md hover:shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {status === 'sending' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Gönder
            </>
          )}
        </button>
      </form>
    </div>
  );
}
