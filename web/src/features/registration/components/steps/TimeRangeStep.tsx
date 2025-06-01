"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, SwatchBook } from 'lucide-react';
import type { FestivalRegisterData } from './types';

// Hardcodierte Festival-Tage - diese ändern sich nie
const FESTIVAL_DAYS = ["31.07.", "01.08.", "02.08.", "03.08."];

interface TimeRangeStepProps {
  form: FestivalRegisterData;
  setForm: React.Dispatch<React.SetStateAction<FestivalRegisterData>>;
  fromDay: number;
  toDay: number;
  setFromDay: (day: number) => void;
  setToDay: (day: number) => void;
}

const TimeRangeStep: React.FC<TimeRangeStepProps> = ({ 
  form, 
  setForm, 
  fromDay, 
  toDay, 
  setFromDay, 
  setToDay 
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <SwatchBook className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Von wann bis wann bist du da?</span>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Von</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={fromDay === 0} onClick={() => setFromDay(Math.max(0, fromDay - 1))} className="p-1"><ChevronLeft /></button>
              <select value={fromDay} onChange={e => setFromDay(Number(e.target.value))} className="rounded border px-2 py-1">
                {FESTIVAL_DAYS.map((d, i) => i <= toDay && <option key={d} value={i}>{d}</option>)}
              </select>
              <button type="button" disabled={fromDay === toDay} onClick={() => setFromDay(Math.min(toDay, fromDay + 1))} className="p-1"><ChevronRight /></button>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Bis</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={toDay === fromDay} onClick={() => setToDay(Math.max(fromDay, toDay - 1))} className="p-1"><ChevronLeft /></button>
              <select value={toDay} onChange={e => setToDay(Number(e.target.value))} className="rounded border px-2 py-1">
                {FESTIVAL_DAYS.map((d, i) => i >= fromDay && <option key={d} value={i}>{d}</option>)}
              </select>
              <button type="button" disabled={toDay === FESTIVAL_DAYS.length - 1} onClick={() => setToDay(Math.min(FESTIVAL_DAYS.length - 1, toDay + 1))} className="p-1"><ChevronRight /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRangeStep; 