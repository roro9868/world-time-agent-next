import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'World Time Agent',
  description: 'A modern world time converter with beautiful UI that helps you track time across multiple timezones with precision',
  keywords: ['world time', 'timezone converter', 'time tracking', 'global time', 'international time'],
  authors: [{ name: 'World Time Agent' }],
  creator: 'World Time Agent',
  publisher: 'World Time Agent',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  colorScheme: 'light dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
