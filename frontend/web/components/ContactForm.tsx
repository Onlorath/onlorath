'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ContactFormProps {
  lang?: 'tr' | 'en';
}

export default function ContactForm({ lang = 'tr' }: ContactFormProps) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '', honeypot: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const isEn = lang === 'en';

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = isEn ? 'Identifier required.' : 'Kimlik zorunludur.';
    
    if (!formData.email.trim()) {
      newErrors.email = isEn ? 'Relay node required.' : 'E-posta zorunludur.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isEn ? 'Invalid format.' : 'Geçersiz format.';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = isEn ? 'Payload required.' : 'Mesaj zorunludur.';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = isEn ? 'Payload too short.' : 'Mesaj çok kısa.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('sending');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          honeypot: formData.honeypot
        })
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '', honeypot: '' });
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('API Error:', errData);
        setStatus('error');
      }
    } catch (err) {
      console.error('Submission Error:', err);
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

  return (
    <div className="glass-panel p-8 h-full flex flex-col relative border border-primary-fixed-dim/20 rounded-none before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary-fixed-dim/5 before:to-transparent before:pointer-events-none overflow-hidden">
      {/* Honeypot field (hidden from real users, filled by bots) */}
      <input type="text" name="honeypot" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" value={formData.honeypot || ''} onChange={handleChange} />
      <div className="flex items-center space-x-2 mb-8 border-b border-surface-variant pb-4 relative z-10">
        <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
        <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
        <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
        <span className="font-label-mono text-label-mono text-on-surface-variant ml-4">TERMINAL_INPUT // UPLINK</span>
      </div>
      
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col space-y-6 relative z-10" id="uplink-form">
        <div className="group relative">
          <label className="font-label-mono text-label-mono text-primary-fixed-dim block mb-2 opacity-80 group-focus-within:opacity-100 transition-opacity" htmlFor="id_name">
            &gt; IDENTIFIER [Name]
          </label>
          <input 
            className={`w-full bg-[#0A0A0C] border ${errors.name ? 'border-error' : 'border-surface-variant focus:border-primary-fixed-dim focus:shadow-[inset_0_0_10px_rgba(0,219,233,0.1)]'} rounded-none text-primary-fixed-dim font-code-sm px-4 py-3 transition-all duration-300 placeholder:text-surface-variant outline-none`}
            id="id_name" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={status === 'sending'}
            placeholder={isEn ? "Enter your designation..." : "Tanımlamanızı girin..."} 
            type="text"
          />
          {errors.name && <span className="font-code-sm text-error text-[11px] absolute -bottom-5 left-0">{errors.name}</span>}
        </div>
        
        <div className="group relative">
          <label className="font-label-mono text-label-mono text-primary-fixed-dim block mb-2 opacity-80 group-focus-within:opacity-100 transition-opacity" htmlFor="id_email">
            &gt; RELAY_NODE [Email]
          </label>
          <input 
            className={`w-full bg-[#0A0A0C] border ${errors.email ? 'border-error' : 'border-surface-variant focus:border-primary-fixed-dim focus:shadow-[inset_0_0_10px_rgba(0,219,233,0.1)]'} rounded-none text-primary-fixed-dim font-code-sm px-4 py-3 transition-all duration-300 placeholder:text-surface-variant outline-none`}
            id="id_email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={status === 'sending'}
            placeholder={isEn ? "Enter return address..." : "Dönüş adresini girin..."} 
            type="email"
          />
          {errors.email && <span className="font-code-sm text-error text-[11px] absolute -bottom-5 left-0">{errors.email}</span>}
        </div>
        
        <div className="group relative flex-grow flex flex-col">
          <label className="font-label-mono text-label-mono text-primary-fixed-dim block mb-2 opacity-80 group-focus-within:opacity-100 transition-opacity" htmlFor="id_message">
            &gt; PAYLOAD [Message]
          </label>
          <textarea 
            className={`w-full flex-grow bg-[#0A0A0C] border ${errors.message ? 'border-error' : 'border-surface-variant focus:border-primary-fixed-dim focus:shadow-[inset_0_0_10px_rgba(0,219,233,0.1)]'} rounded-none text-primary-fixed-dim font-code-sm px-4 py-3 transition-all duration-300 placeholder:text-surface-variant resize-none outline-none`}
            id="id_message" 
            name="message"
            value={formData.message}
            onChange={handleChange}
            disabled={status === 'sending'}
            placeholder={isEn ? "Enter transmission data..." : "İletişim verisini girin..."} 
            rows={6}
          ></textarea>
          {errors.message && <span className="font-code-sm text-error text-[11px] absolute -bottom-5 left-0">{errors.message}</span>}
        </div>
        
        <div className="pt-4 flex items-center justify-between">
          <div className={`font-label-mono text-label-mono ${status === 'error' ? 'text-error' : 'text-surface-variant'}`} id="status-text">
            STATUS: {status === 'sending' ? 'PROCESSING' : status === 'error' ? 'ERROR' : 'STANDBY'}
          </div>
          <button 
            className="bg-primary-container text-on-primary-container font-label-mono text-label-mono px-8 py-3 uppercase tracking-wider hover:bg-primary transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50" 
            id="submit-btn" 
            type="submit"
            disabled={status === 'sending'}
          >
            <span>{isEn ? 'TRANSMIT' : 'İLET'}</span>
            {status === 'sending' ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">send</span>
            )}
          </button>
        </div>
      </form>

      {/* Success State */}
      {status === 'success' && (
        <div className="absolute inset-0 bg-[#0A0A0C]/95 backdrop-blur-md flex flex-col items-center justify-center border border-primary-fixed-dim/50 z-20 animate-fade-in" id="success-state">
          <span className="material-symbols-outlined text-[72px] text-primary-fixed-dim mb-4 drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">check_circle</span>
          <h3 className="font-headline-md text-headline-md text-primary-fixed-dim mb-2">{isEn ? 'SIGNAL TRANSMITTED' : 'SİNYAL İLETİLDİ'}</h3>
          <p className="font-code-sm text-code-sm text-on-surface-variant text-center max-w-sm">
            {isEn ? 'Payload delivered successfully. Awaiting processing cycle.' : 'Paket başarıyla teslim edildi. İşlem döngüsü bekleniyor.'}
          </p>
          <button 
            onClick={() => setStatus('idle')}
            className="mt-8 border border-primary-fixed-dim/50 text-primary-fixed-dim font-label-mono px-6 py-2 hover:bg-primary-fixed-dim/10 transition-colors" 
            id="reset-btn"
          >
            INITIATE_NEW
          </button>
        </div>
      )}
    </div>
  );
}
