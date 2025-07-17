import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'World Time Agent',
  description: 'A modern world time converter with beautiful UI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
