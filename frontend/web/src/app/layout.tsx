import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onlorath | Senior AI & Systems Architect',
  description:
    'High-performance portfolio of an enterprise Systems Architect & AI/WebGL Engineer. Specializing in Go clean architecture, distributed streaming, sub-50µs engines, and GPU shaders.',
  keywords: [
    'System Architect',
    'Senior Software Engineer',
    'Golang',
    'Three.js',
    'WebGL',
    'AI Agents',
    'Distributed Systems',
    'GLSL',
    'PyTorch',
    'High-Throughput',
  ],
  authors: [{ name: 'Onlorath' }],
  openGraph: {
    title: 'Onlorath | Senior AI & Systems Architect',
    description: 'High-performance portfolio: Go, Distributed Systems, WebGL, AI Agent Orchestration.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#030014',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="space-backdrop" />
        <div className="scanline-layer" />
        {children}
      </body>
    </html>
  );
}
