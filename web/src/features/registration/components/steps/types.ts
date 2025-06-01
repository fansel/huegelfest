import React from 'react';
import { getCentralFestivalDays } from '@/shared/services/festivalDaysService';
import { convertToLegacyFormat } from '@/shared/utils/festivalDaysUtils';

export interface FestivalRegisterData {
  name: string;
  days: number[]; // Indizes der gewählten Tage
  isMedic: boolean;
  travelType: "zug" | "auto" | "fahrrad" | "andere";
  equipment: string;
  concerns: string;
  wantsToOfferWorkshop: string;
  sleepingPreference: "bed" | "tent" | "car";
  lineupContribution: string;
  deviceId?: string; // DeviceID für User-Erstellung
  // Neue Felder
  canStaySober: boolean; // Kann nüchtern bleiben für Notfall-Autofahren
  wantsAwareness: boolean; // Möchte Awareness-Schicht übernehmen
  programContribution: string; // Programmpunkt-Beitrag (ersetzt lineupContribution)
  hasConcreteIdea: boolean; // Hat konkrete Idee für Programmpunkt
  wantsKitchenHelp: boolean; // Möchte bei Essensplanung helfen
  allergies: string; // Allergien und Unverträglichkeiten
  allowsPhotos: boolean; // Erlaubt Fotos und Videos
  wantsLineupContribution: boolean; // Möchte zum Line-Up beitragen
  contactType: "phone" | "telegram" | "none"; // Art des Kontakts
  contactInfo: string; // Telefonnummer oder Telegram Handle
}

export const defaultData: FestivalRegisterData = {
  name: "",
  days: [0, 1, 2, 3],
  isMedic: false,
  travelType: "zug",
  equipment: "",
  concerns: "",
  wantsToOfferWorkshop: "",
  sleepingPreference: "tent",
  lineupContribution: "",
  // Neue Standardwerte
  canStaySober: false,
  wantsAwareness: false,
  programContribution: "",
  hasConcreteIdea: false,
  wantsKitchenHelp: false,
  allergies: "",
  allowsPhotos: true,
  wantsLineupContribution: false,
  contactType: "none",
  contactInfo: "",
};

export interface StepProps {
  form: FestivalRegisterData;
  setForm: React.Dispatch<React.SetStateAction<FestivalRegisterData>>;
}

export interface StepConfig {
  label: string;
  content: React.ReactNode;
  isValid: boolean;
  onNext?: () => void;
}

// Maximale Zeichenanzahl für Textareas
export const MAX_TEXTAREA = 200;

export interface PersonalInfoData {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
  };
  tShirtSize: string;
  foodRestrictions: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  motivation: string;
}

export interface GroupSelectionData {
  selectedGroup: string | null;
  newGroupData: {
    name: string;
    members: string[];
  } | null;
}

export interface AvailabilityData {
  availability: Record<string, boolean>;
}

export interface AgreementData {
  termsAccepted: boolean;
  dataProcessingAccepted: boolean;
}

export interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isRequired: boolean;
}

export interface RegistrationData {
  personalInfo: PersonalInfoData;
  groupSelection: GroupSelectionData;
  availability: AvailabilityData;
  agreement: AgreementData;
}

/**
 * Holt die aktuellen Festival-Tage aus der zentralen Verwaltung
 * Diese Funktion muss in einer Server-Umgebung aufgerufen werden
 */
export async function getFestivalDaysForRegistration(): Promise<string[]> {
  try {
    const centralDays = await getCentralFestivalDays();
    return convertToLegacyFormat(centralDays);
  } catch (error) {
    console.error('[getFestivalDaysForRegistration] Fehler beim Laden der Festival-Tage:', error);
    // Fallback zu hardcoded Werten
    return ["31.07.", "01.08.", "02.08.", "03.08."];
  }
}

// Deprecated: Verwende getFestivalDaysForRegistration() stattdessen
// export const FESTIVAL_DAYS = [
//   "31.07.",
//   "01.08.",
//   "02.08.",
//   "03.08."
// ]; 