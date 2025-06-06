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
import { UpdateServiceProvider } from '@/shared/components/UpdateServiceProvider';
import { SWROfflineProvider } from "@/shared/components/SWROfflineProvider";
import { NetworkProvider } from "@/shared/contexts/NetworkContext";
import { OfflineDetector } from "@/shared/components/OfflineDetector";
import ClientOnlyWrapper from "@/shared/components/ClientOnlyWrapper";

/** 
export const metadata: Metadata = {
  title: 'Hügelfest',
  description: 'Die offizielle Progressive Web App für das Hügelfest',
};
*/

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#460b6c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={GeistMono.className}>
      <head>
        <PublicEnvScript />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="react-dev" content="off" />
      </head>
      <body className={`${GeistMono.className} antialiased min-h-screen flex flex-col`}>
        <NetworkProvider>
          <UISettingsProvider>
            <DeviceProvider>
              <AuthProvider>
                <GlobalStateProvider>
                  <PWARegister />
                  <OfflineDetector />
                  <UpdateServiceProvider>
                    <SWROfflineProvider>
                      <ClientOnlyWrapper />
                      {children}
                      <Toaster 
                        position="top-center"
                        toastOptions={{
                          duration: 1000,
                          style: {
                            background: 'white',
                            color: '#333',
                            border: '1px solid rgba(0,0,0,0.1)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          },
                        }}
                      />
                    </SWROfflineProvider>
                  </UpdateServiceProvider>
                </GlobalStateProvider>
              </AuthProvider>
            </DeviceProvider>
          </UISettingsProvider>
        </NetworkProvider>
      </body>
    </html>
  );
} 