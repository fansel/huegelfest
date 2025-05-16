import React from 'react';
import Image from 'next/image';
import { Starfield } from '@/shared/components/Starfield';
import { Countdown } from '@/shared/components/Countdown';
export default function Home() {
 
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#460b6c] text-[#ff9900] font-mono">
      <Starfield />

      <div className="relative z-20 flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-0 sm:py-12 text-center">
        <nav className="absolute top-0 left-0 right-0 z-40 flex justify-center space-x-1 sm:space-x-8 p-1 sm:p-0 rounded-full mx-1 sm:mx-0 pt-[env(safe-area-inset-top)]">
          <a
            href="#infoboard"
            className="text-[#ff9900] hover:text-orange-300 transition-colors text-xs sm:text-base px-1.5 sm:px-3 py-1 sm:py-2 rounded-full hover:bg-[#ff9900] hover:bg-opacity-10 backdrop-blur-sm"
          >
            InfoBoard
          </a>
          <a
            href="#programm"
            className="text-[#ff9900] hover:text-orange-300 transition-colors text-xs sm:text-base px-1.5 sm:px-3 py-1 sm:py-2 rounded-full hover:bg-[#ff9900] hover:bg-opacity-10 backdrop-blur-sm"
          >
            Programm
          </a>
        </nav>

        <div className="absolute top-[env(safe-area-inset-top)] left-4 w-[60px] sm:w-[150px] h-[50px] sm:h-[150px] z-50">
          <div className="relative w-full h-full">
            <Image
              src="/logo.jpg"
              alt="Hügelfest Logo"
              fill
              sizes="(max-width: 768px) 60px, 150px"
              priority
              className="rounded-full hover:scale-105 transition-transform cursor-pointer object-cover"
            />
          </div>
        </div>

        <div className="absolute top-12 sm:top-4 right-2 sm:right-4 text-right">
          <h2 className="text-xs sm:text-xl sm:text-2xl tracking-widest animate-fade-in delay-200">
            31.07.2025 - 03.08.2025
          </h2>
          <Countdown />
        </div>

        <div className="w-full max-w-7xl mx-auto mt-20 sm:mt-32 space-y-8 sm:space-y-16">
          <section
            id="programm"
            className="flex flex-col items-center justify-start px-2 sm:px-4"
          >
            <div className="w-full">
              <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">
                Programm
              </h2>
            </div>
          </section>

          <section
            id="infoboard"
            className="flex flex-col items-center justify-start px-2 sm:px-4"
          >
            <div className="w-full">
              <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">
                InfoBoard
              </h2>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
