import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#460b6c]/20 backdrop-blur-sm p-4 text-center text-sm text-white/60">
      <div className="flex justify-center space-x-4">
        <Link href="/impressum" className="hover:text-white transition-colors">
          Impressum
        </Link>
        <span>•</span>
        <Link href="/datenschutz" className="hover:text-white transition-colors">
          Datenschutz
        </Link>
        <span>•</span>
        <Link href="/admin" className="hover:text-white transition-colors">
          Admin
        </Link>
      </div>
    </footer>
  );
} 