import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GeistSans, GeistMono } from 'geist/font';
import "./globals.css";
import Footer from "@/components/Footer";
import SoundCloudPlayer from "@/components/SoundCloudPlayer";
import PWAContainer from "@/components/PWAContainer";
import { PWAProvider } from "@/contexts/PWAContext";

// Sans-serif body font
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

// Monospaced font for code / secondary text
const geistMono = GeistMono;

// Bold display font just for the title (HÜGELFEST)
const geistSans = GeistSans;

export const metadata: Metadata = {
  title: 'Hügelfest',
  description: 'Die offizielle Progressive Web App für das Hügelfest',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

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
    <html lang="de" className={`${inter.variable} ${geistMono.variable} ${geistSans.variable}`}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <PWAProvider>
          <SoundCloudPlayer />
          <PWAContainer />
          <div className="desktop-only">
            <main className="flex-grow pb-16 md:pb-0">{children}</main>
            <Footer />
          </div>
        </PWAProvider>
      </body>
    </html>
  );
}