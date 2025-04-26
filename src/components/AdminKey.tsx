'use client';

import Link from 'next/link';
import { FaKey } from 'react-icons/fa';

export default function AdminKey() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Link
        href="/login"
        className="inline-block p-2 text-white/30 hover:text-white transition-colors cursor-pointer bg-[#460b6c]/20 hover:bg-[#460b6c]/40 rounded-full backdrop-blur-sm"
        title="Admin Login"
      >
        <FaKey size={24} />
      </Link>
    </div>
  );
} 