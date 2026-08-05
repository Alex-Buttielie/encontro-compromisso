import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Profissional OS',
  description: 'Sistema de gestão para prestadores de serviço',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6366f1',
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('profissionalOS_theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mode = stored || (prefersDark ? 'dark' : 'light');
    var bg = mode === 'dark' ? '#0f172a' : '#f8fafc';
    document.documentElement.style.backgroundColor = bg;
    document.documentElement.setAttribute('data-theme', mode);
    document.body && (document.body.style.backgroundColor = bg);
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
