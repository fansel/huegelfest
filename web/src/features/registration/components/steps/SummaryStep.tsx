"use client";

import React from 'react';
import { User, Bed, Car as CarIcon, SwatchBook, AlertTriangle, Shield, Camera, Stethoscope, ChefHat, Lightbulb, Music, Wrench, MessageCircle, Phone } from 'lucide-react';
import { FormStep } from './FormComponents';
import type { StepProps } from './types';
import { useFestivalDays } from '@/shared/hooks/useFestivalDays';

export function SummaryStep({ form, setForm }: StepProps) {
  const { festivalDays: FESTIVAL_DAYS, loading } = useFestivalDays();

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-4">
        Lade Zusammenfassung...
      </div>
    );
  }

  return (
    <FormStep>
      <div className="flex flex-col gap-1 w-full px-3 py-0 text-sm">
        <span className="block text-xs text-[#460b6c]/70 mb-1 text-center">Zusammenfassung</span>
        <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-3 py-2 text-[#460b6c] w-full flex flex-col gap-1 mx-auto text-sm">
          <div className="flex items-center gap-2"><User className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Name:</span> <span className="truncate">{form.name.trim()}</span></div>
          {form.contactType !== 'none' && form.contactInfo.trim() ? (
            <div className="flex items-center gap-2">
              {form.contactType === 'phone' ? <Phone className="w-4 h-4 text-[#ff9900]" /> : <MessageCircle className="w-4 h-4 text-[#ff9900]" />}
              <span className="font-medium">{form.contactType === 'phone' ? 'Telefon:' : 'Telegram:'}</span> 
              <span className="truncate max-w-[200px]">{form.contactInfo}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2"><Bed className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Schlafplatz:</span> <span>{form.sleepingPreference === 'bed' ? 'Bett' : form.sleepingPreference === 'tent' ? 'Zelt' : 'Auto'}</span></div>
          <div className="flex items-center gap-2"><CarIcon className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Anreise:</span> <span>{form.travelType === 'zug' ? 'Zug' : form.travelType === 'auto' ? 'Auto' : form.travelType === 'fahrrad' ? 'Fahrrad' : 'Unklar'}</span></div>
          <div className="flex items-center gap-2"><SwatchBook className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Zeitraum:</span> <span>{FESTIVAL_DAYS[form.days[0]]} – {FESTIVAL_DAYS[form.days[form.days.length - 1]]}</span></div>
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Nüchtern fahren:</span> <span>{form.canStaySober ? 'Ja' : 'Nein'}</span></div>
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Awareness-Team:</span> <span>{form.wantsAwareness ? 'Ja' : 'Nein'}</span></div>
          <div className="flex items-center gap-2"><Camera className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Fotos:</span> <span>{form.allowsPhotos ? 'Ja' : 'Nein'}</span></div>
          <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Sanitäter:in:</span> <span>{form.isMedic ? 'Ja' : 'Nein'}</span></div>
          <div className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Küchenplanung:</span> <span>{form.wantsKitchenHelp ? 'Ja' : 'Nein'}</span></div>
          {form.programContribution && form.programContribution !== "nein" ? (
            <div className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Programmpunkt:</span> <span>{form.programContribution === "ja_mit_idee" ? "Ja, mit Idee" : "Ja, ohne konkrete Idee"}</span></div>
          ) : null}
          {form.lineupContribution.trim() ? (
            <div className="flex items-center gap-2"><Music className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Line-Up:</span> <span className="truncate max-w-[220px]">{form.lineupContribution.length > 60 ? form.lineupContribution.slice(0, 60) + '…' : form.lineupContribution}</span></div>
          ) : null}
          {form.allergies.trim() ? (
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Allergien:</span> <span className="truncate max-w-[220px]">{form.allergies.length > 60 ? form.allergies.slice(0, 60) + '…' : form.allergies}</span></div>
          ) : null}
          {form.equipment.trim() ? (
            <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Equipment:</span> <span className="truncate max-w-[220px]">{form.equipment.length > 60 ? form.equipment.slice(0, 60) + '…' : form.equipment}</span></div>
          ) : null}
          {form.concerns.trim() ? (
            <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Anliegen:</span> <span className="truncate max-w-[220px]">{form.concerns.length > 60 ? form.concerns.slice(0, 60) + '…' : form.concerns}</span></div>
          ) : null}
        </div>
      </div>
    </FormStep>
  );
} 