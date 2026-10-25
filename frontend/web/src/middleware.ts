import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';

function preferredLocale(req: NextRequest): Locale {
  const header = req.headers.get('accept-language') ?? '';
  for (const part of header.split(',')) {
    const lang = part.split(';')[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split('/')[1];
  if (isLocale(first)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale(req)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|admin|_next|.*\\..*).*)'],
};
