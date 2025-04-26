import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik_Mono_One } from "next/font/google";
import "./globals.css";
import Script from "next/script";

// Sans-serif body font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Monospaced font for code / secondary text
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Bold display font just for the title (HÜGELFEST)
const rubikMono = Rubik_Mono_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "HÜGELFEST 2025",
  description: "Hier geht die Post ab! 🎉 31.07.2025 - 03.08.2025",
  openGraph: {
    title: "HÜGELFEST 2025",
    description: "Hier geht die Post ab! 🎉 31.07.2025 - 03.08.2025",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Hügelfest Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HÜGELFEST 2025",
    description: "Hier geht die Post ab! 🎉 31.07.2025 - 03.08.2025",
    images: ["/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} ${rubikMono.variable}`}
    >
      <head>
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}",
                safari_web_id: "${process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID}",
                notifyButton: {
                  enable: true,
                },
                allowLocalhostAsSecureOrigin: true,
              });
            });
          `}
        </Script>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
