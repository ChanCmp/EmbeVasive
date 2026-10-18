import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata = {
  title: { template: '%s · PawFeeder', default: 'PawFeeder' },
  description: 'Monitoring nafsu makan & penjadwalan automatic pet feeder',
};

export const viewport = { width: 'device-width', initialScale: 1 };

// Pasang tema tersimpan sebelum halaman tampil supaya tidak berkedip
const themeScript = `try{var t=localStorage.getItem('petfeeder.theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
