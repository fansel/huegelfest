'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLink() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="fixed bottom-4 right-4 text-xs sm:text-sm text-white/50 hover:text-white transition-colors bg-[#460b6c]/50 hover:bg-[#460b6c] px-3 py-2 rounded-full backdrop-blur-sm"
    >
      Admin
    </Link>
  );
}
