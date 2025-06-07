import Link from 'next/link';
import { Github, Mail, MapPin, Code } from 'lucide-react';

export default function Impressum() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5a1a7a] to-[#6d2888] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Dev Info */}
        <div className="text-center mb-12">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-[#ff9900] to-[#ffb340] flex items-center justify-center text-6xl font-bold text-white shadow-2xl">
              F
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="text-[#ff9900]">fansel</span>
          </h1>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:huegelfest@hey.fansel.dev"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff9900] text-white rounded-full hover:bg-[#ff9900]/90 transition-all transform hover:scale-105"
            >
              <Mail className="w-5 h-5" />
              Kontakt
            </a>
            <a 
              href="https://github.com/fansel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/20"
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-12 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Code className="w-6 h-6 text-[#ff9900]" />
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'MongoDB'].map((tech) => (
              <span 
                key={tech}
                className="px-3 py-1 bg-[#ff9900]/20 text-[#ff9900] rounded-full text-sm border border-[#ff9900]/30"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Legal Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">Impressum</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#ff9900]" />
                Angaben gemäß § 5 TMG
              </h3>
              <div className="text-white/80 space-y-1">
                <p><strong>Felix Mansel</strong></p>
                <p>Neustädterstraße 19</p>
                <p>04315 Leipzig</p>
                <p>Deutschland</p>
              </div>
              
              <div className="mt-6">
                <h4 className="text-white font-semibold mb-2">Kontakt</h4>
                <a 
                  href="mailto:huegelfest@hey.fansel.dev"
                  className="text-[#ff9900] hover:text-[#ffb340] transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  huegelfest@hey.fansel.dev
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-white font-semibold mb-2">Haftung für Inhalte</h4>
                <p className="text-white/70 text-sm">
                  Als Diensteanbieter bin ich gemäß § 7 Abs.1 TMG für eigene Inhalte 
                  auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Urheberrecht</h4>
                <p className="text-white/70 text-sm">
                  Die durch mich erstellten Inhalte und Werke auf diesen Seiten unterliegen 
                  dem deutschen Urheberrecht. Downloads und Kopien dieser Seite sind nur für 
                  den privaten, nicht kommerziellen Gebrauch gestattet.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            ← Zurück zum Hügelfest
          </Link>
        </div>
      </div>
    </div>
  );
} 