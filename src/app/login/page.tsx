'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/Login';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (password: string) => {
    if (password === 'admin') {
      // Setze den Cookie mit korrekten Einstellungen
      document.cookie = 'isAuthenticated=true; path=/; SameSite=Lax';
      console.log('Cookie gesetzt');
      
      // Warte etwas länger und versuche die Weiterleitung
      setTimeout(() => {
        console.log('Versuche Weiterleitung zu /admin');
        router.push('/admin');
      }, 300);
    } else {
      setError('Falsches Passwort');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#460b6c] p-4">
      <Login onLogin={handleLogin} error={error} />
    </div>
  );
} 