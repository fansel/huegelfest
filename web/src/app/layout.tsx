import type { Metadata, Viewport } from "next";
import { GeistMono } from 'geist/font/mono';
import { PublicEnvScript } from 'next-runtime-env';
import "@/app/global.css";
import { PWAProvider } from "@/contexts/PWAContext";
import { Toaster } from 'react-hot-toast';
import { PWARegister } from "@/shared/components/PWARegister";
import AppLayout from "@/shared/components/AppLayout";
import { AuthProvider } from '@/features/auth/AuthContext';
import { GlobalStateProvider } from '@/contexts/GlobalStateContext';

export const metadata: Metadata = {
  title: 'Hügelfest',
  description: 'Die offizielle Progressive Web App für das Hügelfest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#460b6c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={GeistMono.className}>
      <head>
        <PublicEnvScript />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <PWARegister />
        <PWAProvider>
          <AuthProvider>
            <GlobalStateProvider>
              <AppLayout>{children}</AppLayout>
              <Toaster position="top-right" />
            </GlobalStateProvider>
          </AuthProvider>
        </PWAProvider>
      </body>
    </html>
  );
} 