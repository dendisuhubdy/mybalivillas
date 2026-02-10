import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'MyBaliVilla - Find Your Dream Property in Bali',
    template: '%s | MyBaliVilla',
  },
  description:
    'Discover premium villas, houses, apartments, land, and commercial properties in Bali. Buy, rent, or find short-term stays in paradise.',
  keywords: [
    'Bali real estate',
    'Bali villa',
    'Bali property',
    'buy villa Bali',
    'rent villa Bali',
    'Seminyak villa',
    'Canggu villa',
    'Ubud property',
    'Bali investment',
  ],
  openGraph: {
    title: 'MyBaliVilla - Find Your Dream Property in Bali',
    description:
      'Discover premium villas, houses, apartments, land, and commercial properties in Bali.',
    type: 'website',
    locale: 'en_US',
    siteName: 'MyBaliVilla',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
