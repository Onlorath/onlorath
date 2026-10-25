import type { Locale } from '@/lib/i18n';

const tr = {
  meta: { title: 'Portföy' },
  nav: { label: 'Ana menü', projects: 'Projeler', about: 'Hakkımda', blog: 'Blog', contact: 'İletişim', message: 'Mesaj At', language: 'Dil' },
  projects: {
    title: 'Projeler',
    filterLabel: 'Projeleri filtrele',
    all: 'Tümü',
    games: 'Oyunlar',
    software: 'Yazılım',
    empty: 'Bu kategoride proje yok.',
    expand: 'Detayları aç',
    collapse: 'Detayları kapat',
  },
  balloons: {
    score: 'Skor:',
    pop: 'pof!',
    doneTitle: 'Hepsi patladı.',
    restart: 'Tekrar oyna',
    balloon: 'Balon',
  },
  about: { journey: 'Deneyim', skills: 'Yetenekler' },
  contact: {
    cv: 'CV',
    openForm: 'Form ile yaz',
    closeForm: 'Formu kapat',
    name: 'Ad',
    email: 'E-posta',
    message: 'Mesaj',
    send: 'Gönder',
    sending: 'Gönderiliyor…',
    sent: 'Mesajın gönderildi.',
    error: 'Mesaj gönderilemedi. Daha sonra tekrar dene.',
    rateLimited: 'Çok fazla deneme. Biraz bekleyip tekrar dene.',
  },
  footer: { social: 'Sosyal bağlantılar' },
  blog: {
    title: 'Blog',
    empty: 'Henüz yazı yok.',
    read: 'Oku',
    back: 'Tüm yazılar',
  },
  chat: {
    open: 'Asistana sor',
    title: 'Asistan',
    placeholder: 'Bir soru yaz…',
    send: 'Gönder',
    close: 'Kapat',
    reset: 'Yeni sohbet',
    thinking: 'Yazıyor…',
    errors: {
      chat_quota_exceeded: 'Mesaj hakkın doldu. İletişim formunu kullanabilirsin.',
      chat_system_busy: 'Asistan şu anda yoğun. Daha sonra tekrar dene.',
      chat_unavailable: 'Asistan şu anda kullanılamıyor.',
      chat_upstream_busy: 'Asistan şu anda yoğun. Daha sonra tekrar dene.',
      generic: 'Bir hata oluştu. Tekrar dene.',
    },
  },
  errors: { title: 'Sayfa yüklenemedi', retry: 'Tekrar dene' },
};

export type Dictionary = typeof tr;

const en: Dictionary = {
  meta: { title: 'Portfolio' },
  nav: { label: 'Main menu', projects: 'Projects', about: 'About', blog: 'Blog', contact: 'Contact', message: 'Contact', language: 'Language' },
  projects: {
    title: 'Projects',
    filterLabel: 'Filter projects',
    all: 'All',
    games: 'Games',
    software: 'Software',
    empty: 'No projects in this category.',
    expand: 'Show details',
    collapse: 'Hide details',
  },
  balloons: {
    score: 'Score:',
    pop: 'pop!',
    doneTitle: 'All popped.',
    restart: 'Play again',
    balloon: 'Balloon',
  },
  about: { journey: 'Experience', skills: 'Skills' },
  contact: {
    cv: 'CV',
    openForm: 'Write via form',
    closeForm: 'Close form',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    send: 'Send',
    sending: 'Sending…',
    sent: 'Message sent.',
    error: 'Could not send the message. Please try again later.',
    rateLimited: 'Too many attempts. Please wait and try again.',
  },
  footer: { social: 'Social links' },
  blog: {
    title: 'Blog',
    empty: 'No posts yet.',
    read: 'Read',
    back: 'All posts',
  },
  chat: {
    open: 'Ask the assistant',
    title: 'Assistant',
    placeholder: 'Type a question…',
    send: 'Send',
    close: 'Close',
    reset: 'New chat',
    thinking: 'Typing…',
    errors: {
      chat_quota_exceeded: 'You are out of messages. Please use the contact form.',
      chat_system_busy: 'The assistant is busy. Please try again later.',
      chat_unavailable: 'The assistant is not available right now.',
      chat_upstream_busy: 'The assistant is busy. Please try again later.',
      generic: 'Something went wrong. Please try again.',
    },
  },
  errors: { title: 'The page could not be loaded', retry: 'Try again' },
};

const dictionaries: Record<Locale, Dictionary> = { tr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
