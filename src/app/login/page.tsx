'use client';

import { AuthProvider, useAuth } from '@/client/contexts/AuthContext';
import Login from '@/client/components/Login';
import { useRouter } from 'next/navigation';

function LoginWithAuth() {
  const { login, error } = useAuth();
  const router = useRouter();

  const handleLogin = async (username: string, password: string) => {
    try {
      await login(username, password);
      router.push('/admin');
    } catch (error) {
      // Fehler wird bereits vom AuthContext behandelt
    }
  };

  return <Login onLogin={handleLogin} error={error || undefined} />;
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginWithAuth />
    </AuthProvider>
  );
} 