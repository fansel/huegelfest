'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Admin läuft jetzt über PWA-Container - redirect zur Hauptseite
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      Weiterleitung zum Admin-Bereich...
    </div>
  );
}
