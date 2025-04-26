import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik_Mono_One } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

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
      <body className="antialiased min-h-screen flex flex-col">
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
