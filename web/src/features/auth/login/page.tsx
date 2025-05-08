'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/features/admin/components/LoginForm';
import { login } from '@/features/auth/actions/login';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (username: string, password: string) => {
    try {
      await login(username, password);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Login fehlgeschlagen');
    }
  };

  return <LoginForm onLogin={handleLogin} error={error || undefined} />;
}