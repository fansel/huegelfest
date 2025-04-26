'use client';

import Link from 'next/link';

export default function AdminLink() {
  return (
    <Link
      href="/admin"
      className="fixed bottom-4 right-4 text-xs text-white/50 hover:text-white transition-colors"
    >
      Admin
    </Link>
  );
} 