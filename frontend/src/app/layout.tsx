import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'WooCommerce Analytics Dashboard',
  description:
    'Multi-store WooCommerce analytics dashboard for e-commerce businesses',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
