import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NYC Musicians Wanted',
  description: 'A place for New York Musicians to find opportunities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${inter.className} bg-gradient-to-t from-[#121212] to-[#191414] min-h-screen`}
      >
        <Toaster />
        {children}
      </body>
    </html>
  );
}
