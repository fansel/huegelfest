import React from 'react';

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

// Festivaldaten
export const FESTIVAL_DAYS = [
  "31.07.",
  "01.08.",
  "02.08.",
  "03.08."
]; 