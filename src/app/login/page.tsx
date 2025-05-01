'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Login from '@/components/Login';

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-[#460b6c] p-4">
        <Login />
      </div>
    </AuthProvider>
  );
} 