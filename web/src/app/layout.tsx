import type { Metadata, Viewport } from "next";
import { GeistMono } from 'geist/font/mono';
import { PublicEnvScript } from 'next-runtime-env';
import "@/app/global.css";
import { Toaster } from 'react-hot-toast';
import { PWARegister } from "@/shared/components/PWARegister";
import { AuthProvider } from '@/features/auth/AuthContext';
import { GlobalStateProvider } from '@/contexts/GlobalStateContext';
import React from 'react';
import { DeviceProvider } from "@/shared/contexts/DeviceContext";
import { UISettingsProvider } from '@/shared/contexts/UISettingsContext';
import { SWRProvider } from '@/contexts/SWRProvider';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="de" className={GeistMono.className}>
      <head>
        <PublicEnvScript />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`antialiased min-h-screen flex flex-col`}>
        <PWARegister />
        <DeviceProvider>
          <SWRProvider>
            <AuthProvider>
              <GlobalStateProvider>
                <UISettingsProvider>
                  {children}
                  <Toaster position="top-right" />
                </UISettingsProvider>
              </GlobalStateProvider>
            </AuthProvider>
          </SWRProvider>
        </DeviceProvider>
      </body>
    </html>
  );
} 