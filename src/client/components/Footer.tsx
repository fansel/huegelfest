'use client';

import Link from 'next/link';
import { FaInstagram } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="bg-[#460b6c] text-[#ff9900] py-4 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-4">
            <Link
              href="https://www.instagram.com/huegelfest"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#ff9900]/80 transition-colors"
            >
              <FaInstagram className="text-xl" />
            </Link>
          </div>
          <div className="text-center">
            <p className="text-sm">
              © {new Date().getFullYear()} Hügelfest. Alle Rechte vorbehalten.
            </p>
            <p className="text-xs mt-1 flex flex-wrap justify-center gap-2">
              <Link
                href="/impressum"
                className="hover:text-[#ff9900]/80 transition-colors"
              >
                Impressum
              </Link>
              <span>|</span>
              <Link
                href="/datenschutz"
                className="hover:text-[#ff9900]/80 transition-colors"
              >
                Datenschutz
              </Link>
              <span>|</span>
              <Link href="/admin" className="hover:text-[#ff9900]/80 transition-colors">
                Admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
