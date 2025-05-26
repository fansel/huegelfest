"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "react-hot-toast";
import { useSwipeable } from "react-swipeable";
import {
  Bed,
  Tent,
  Car as CarIcon,
  Stethoscope,
  Hammer,
  Wrench,
  HelpCircle,
  MessageCircle,
  Music,
  ChevronLeft,
  ChevronRight,
  MailCheck,
  Train,
  Bike,
  User,
  Euro,
  ArrowLeft,
  ArrowRight,
  SwatchBook,
  Check,
  CheckCircle,
} from 'lucide-react';
import { registerFestival, getExistingRegistration } from './actions/register';
import { useDeviceContext } from "@/shared/contexts/DeviceContext";
import { useDeviceId } from "@/shared/hooks/useDeviceId";
import Cookies from 'js-cookie';

// Maximale Zeichenanzahl für Textareas
const MAX_TEXTAREA = 200;

// Festivaldaten
const FESTIVAL_DAYS = [
  "31.07.",
  "01.08.",
  "02.08.",
  "03.08."
];

// 1. Neue Anreise-Optionen
const TRAVEL_OPTIONS = [
  { value: 'zug', label: 'Zug' },
  { value: 'auto', label: 'Auto' },
  { value: 'fahrrad', label: 'Fahrrad' },
];

// Custom hook für Keyboard Detection
function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const initialViewportHeight = useRef<number | null>(null);

  useEffect(() => {
    // iOS Safari specific detection
    const visualViewport = window.visualViewport;
    
    if (visualViewport) {
      // Store initial height for comparison
      initialViewportHeight.current = visualViewport.height;
      
      const handleResize = () => {
        if (!initialViewportHeight.current) return;
        
        // Keyboard is likely open if viewport height is significantly less than initial height
        // Usually keyboards take at least 30% of the screen
        const heightDifference = initialViewportHeight.current - visualViewport.height;
        const heightRatio = visualViewport.height / initialViewportHeight.current;
        setIsKeyboardVisible(heightRatio < 0.7 || heightDifference > 150);
      };
      
      visualViewport.addEventListener('resize', handleResize);
      return () => visualViewport.removeEventListener('resize', handleResize);
    } else {
      // Fallback detection based on window size
      initialViewportHeight.current = window.innerHeight;
      
      const handleResize = () => {
        if (!initialViewportHeight.current) return;
        const heightRatio = window.innerHeight / initialViewportHeight.current;
        setIsKeyboardVisible(heightRatio < 0.7);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return isKeyboardVisible;
}

// Hook für auto-scroll zum fokussierten Element
function useAutoScrollOnFocus(containerRef: React.RefObject<HTMLElement>, isKeyboardVisible: boolean) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocus = (e: FocusEvent) => {
      if (!isKeyboardVisible) return;
      
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Warte kurz, bis die Tastatur vollständig geöffnet ist
        setTimeout(() => {
          const targetRect = target.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Berechne, wie weit wir scrollen müssen
          const targetCenter = targetRect.top + targetRect.height/2;
          const containerCenter = containerRect.top + containerRect.height/2;
          const scrollOffset = targetCenter - containerCenter;
          
          container.scrollBy({
            top: scrollOffset,
            behavior: 'smooth'
          });
        }, 300);
      }
    };

    document.addEventListener('focus', handleFocus, true);
    return () => document.removeEventListener('focus', handleFocus, true);
  }, [containerRef, isKeyboardVisible]);
}

export interface FestivalRegisterData {
  name: string;
  days: number[]; // Indizes der gewählten Tage
  priceOption: "full" | "reduced" | "free";
  isMedic: boolean;
  travelType: "zug" | "auto" | "fahrrad" | "andere";
  equipment: string;
  concerns: string;
  wantsToContribute: boolean;
  wantsToOfferWorkshop: string;
  sleepingPreference: "bed" | "tent" | "car";
  lineupContribution: string;
  deviceId?: string; // DeviceID für User-Erstellung
}

const defaultData: FestivalRegisterData = {
  name: "",
  days: [0, 1, 2, 3],
  priceOption: "full",
  isMedic: false,
  travelType: "zug",
  equipment: "",
  concerns: "",
  wantsToContribute: false,
  wantsToOfferWorkshop: "",
  sleepingPreference: "tent",
  lineupContribution: "",
};

// --- Eigene Feld-Komponenten für einheitliches Design ---

interface InputFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
}
function InputField({ label, icon, id, value, onChange, type = "text", required, autoFocus }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={id} className="block font-medium text-[#460b6c] text-lg flex items-center gap-2">
        {icon}
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-gray-300 py-4 px-7 min-h-[48px] text-lg focus:outline-none focus:border-[#ff9900] focus:border-2 border-2"
      />
    </div>
  );
}

interface TextareaFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  id: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
}
function TextareaField({ label, icon, id, value, onChange, maxLength, placeholder }: TextareaFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + 'px';
    }
  }, [value]);
  return (
    <div className="flex flex-col gap-1 w-full px-3 py-0 text-sm">
      <label htmlFor={id} className="block font-medium text-[#460b6c] text-lg flex items-center gap-2">
        {icon}
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={e => {
          if (e.target.value.length <= maxLength) onChange(e.target.value);
        }}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 min-h-[48px] resize-none max-h-40 focus:outline-none focus:border-[#ff9900] focus:border-2 border-2 px-3 py-2 text-sm"
      />
      <div className="text-right text-xs text-gray-500">{value.length}/{maxLength} Zeichen</div>
    </div>
  );
}

interface CheckboxFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}
function CheckboxField({ label, icon, checked, onChange, id }: CheckboxFieldProps) {
  return (
    <div className="flex flex-col w-full items-center gap-2">
      {/* Card-Style für Checkbox */}
      <div
        className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border transition-all cursor-pointer select-none
          ${checked ? 'border-[#ff9900] bg-[#ff9900]/10 shadow-sm' : 'border-gray-300 bg-white'}`}
        style={{ minWidth: 120, maxWidth: 320 }}
        onClick={() => onChange(!checked)}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="accent-[#ff9900] w-5 h-5"
        />
        {icon && <span className="inline-block align-middle">{icon}</span>}
        <span className="text-lg font-medium">{label}</span>
      </div>
    </div>
  );
}

interface RadioGroupFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  value: string;
  options: { value: string; label: React.ReactNode; icon?: React.ReactNode }[];
  onChange: (v: string) => void;
  id: string;
}
function RadioGroupField({ label, icon, value, options, onChange, id }: RadioGroupFieldProps) {
  return (
    <div className="flex flex-col gap-2 w-full items-center">
      <label className="block font-medium text-[#460b6c] text-lg w-full text-center flex items-center justify-center gap-2">
        {icon}
        {label}
      </label>
      <div className="w-full flex flex-col gap-3 justify-center pb-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`flex flex-col items-center gap-1 cursor-pointer select-none text-lg px-3 py-2 rounded-lg border transition-all
              ${value === opt.value ? 'border-[#ff9900] bg-[#ff9900]/10 shadow-sm' : 'border-gray-300 bg-white'}`}
            style={{ width: '100%' }}
          >
            <div className="flex items-center gap-2 w-full">
              <input
                type="radio"
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="accent-[#ff9900] w-5 h-5 focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
              />
              {opt.icon}
              <span className="whitespace-nowrap font-medium">{typeof opt.label === 'string' ? opt.label.split('||')[0] : opt.label}</span>
            </div>
            {/* Zusatzinfo unter dem Hauptlabel, falls vorhanden */}
            {typeof opt.label === 'string' && opt.label.includes('||') && (
              <span className="text-xs text-gray-500 mt-0.5">{opt.label.split('||')[1]}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

// Wrapper für jeden Step
function FormStep({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col justify-center gap-4 px-2">
      {children}
    </div>
  );
}

export interface FestivalRegisterFormProps {
  onRegister?: (data: FestivalRegisterData) => void;
  setCookies?: boolean;
  skipRegistrationCheck?: boolean;
  customDeviceId?: string;
}

const LOCAL_STORAGE_KEY = 'festival_register_form';

export default function FestivalRegisterForm({ onRegister, setCookies = true, skipRegistrationCheck = false, customDeviceId }: FestivalRegisterFormProps) {
  const { deviceType } = useDeviceContext();
  const deviceId = useDeviceId();
  const isMobile = deviceType === "mobile";
  const [form, setForm] = useState<FestivalRegisterData>(defaultData);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [fromDay, setFromDay] = useState(0);
  const [toDay, setToDay] = useState(FESTIVAL_DAYS.length - 1);
  const formRef = useRef<HTMLFormElement>(null);
  const [hasCookie, setHasCookie] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isKeyboardVisible = useKeyboardVisible();
  const [isLoaded, setIsLoaded] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any | null>(null);
  
  // ✅ RACE CONDITION FIX: Verhindere mehrfache Registration-Checks
  const hasAlreadyCheckedRef = useRef(false);
  
  // Verwende den Auto-Scroll-Hook
  useAutoScrollOnFocus(contentRef, isKeyboardVisible);
  
  // Synchronisiere fromDay/toDay mit form.days wenn Daten geladen werden
  useEffect(() => {
    if (form.days && form.days.length > 0) {
      const minDay = Math.min(...form.days);
      const maxDay = Math.max(...form.days);
      
      // Nur aktualisieren wenn sich die Werte geändert haben
      if (minDay !== fromDay || maxDay !== toDay) {
        console.log('[FestivalRegisterForm] Synchronisiere Zeitraumauswahl:', {
          formDays: form.days,
          newFromDay: minDay,
          newToDay: maxDay,
          currentFromDay: fromDay,
          currentToDay: toDay
        });
        setFromDay(minDay);
        setToDay(maxDay);
      }
    }
  }, [form.days, fromDay, toDay]);
  
  // Debug: Überwache form State Änderungen
  useEffect(() => {
    console.log('[FestivalRegisterForm] Form State geändert:', {
      name: form.name,
      days: form.days,
      priceOption: form.priceOption,
      hasName: !!form.name.trim(),
      isDefault: form === defaultData
    });
  }, [form]);
  
  // Disable scrolling on body
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [isMobile]);

  // NEU: Kombinierter Check - Cookie DANN DB-Check
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      // Frühe Rückkehr wenn Registration-Check übersprungen werden soll
      if (skipRegistrationCheck) {
        console.log('[FestivalRegisterForm] Registration-Check übersprungen (skipRegistrationCheck=true)');
        setIsLoaded(true);
        hasAlreadyCheckedRef.current = true;
        return;
      }

      // ✅ RACE CONDITION FIX: Wenn bereits gecheckt und Registration geladen, dann abbrechen
      if (hasAlreadyCheckedRef.current && existingRegistration) {
        console.log('[FestivalRegisterForm] Registration bereits geladen - überspringe Check');
        return;
      }
      
      console.log('[FestivalRegisterForm] Starte Registration-Check für deviceId:', deviceId);
      
      // 1. ERST: Cookie-Check (synchron)
      const hasCookieSet = !!Cookies.get('festival_registered');
      console.log('[FestivalRegisterForm] Cookie-Status:', hasCookieSet);
      
      // 2. SOFORT: localStorage Check für Offline-Fallback
      let localStorageData = null;
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            localStorageData = parsed;
            console.log('[FestivalRegisterForm] localStorage-Daten gefunden:', localStorageData);
          }
        }
      } catch (e) {
        console.error('[FestivalRegisterForm] localStorage-Parse-Fehler:', e);
      }
      
      // 3. Netzwerk-Check: Versuche DB-Abfrage, bei Fehler sofort localStorage verwenden
      if (deviceId) {
        try {
          console.log('[FestivalRegisterForm] Prüfe DB für deviceId:', deviceId);
          console.log('[FestivalRegisterForm] Rufe getExistingRegistration auf...');
          
          const result = await getExistingRegistration(deviceId);
          console.log('[FestivalRegisterForm] getExistingRegistration Ergebnis:', result);
          console.log('[FestivalRegisterForm] result.success:', result.success);
          console.log('[FestivalRegisterForm] result.data:', result.data);
          console.log('[FestivalRegisterForm] result.data?.formData:', result.data?.formData);
          
          if (result.success && result.data?.formData) {
            console.log('[FestivalRegisterForm] Bestehende Registration in DB gefunden!');
            console.log('[FestivalRegisterForm] FormData Name:', result.data.formData.name);
            console.log('[FestivalRegisterForm] FormData Days:', result.data.formData.days);
            console.log('[FestivalRegisterForm] FormData PriceOption:', result.data.formData.priceOption);
            console.log('[FestivalRegisterForm] Vollständige FormData:', result.data.formData);
            
            // Lade Daten aus DB - WICHTIG: Vor allen State-Updates loggen
            console.log('[FestivalRegisterForm] Aktuelle form vor Update:', form);
            setForm(result.data.formData);
            console.log('[FestivalRegisterForm] setForm aufgerufen mit:', result.data.formData);
            
            setExistingRegistration(result.data);
            
            // Setze Cookie falls noch nicht vorhanden
            if (setCookies && !hasCookieSet) {
              Cookies.set('festival_registered', 'true', { expires: 365 });
            }
            setHasCookie(true);
            setStep(steps.length - 1); // Direkt zur Bestätigungsseite
            
            // Auch in localStorage als Fallback
            try { 
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result.data.formData)); 
              console.log('[FestivalRegisterForm] localStorage gesetzt');
            } catch (e) { 
              console.error('[FestivalRegisterForm] localStorage-Fehler:', e); 
            }
            
            hasAlreadyCheckedRef.current = true; // ✅ Markiere als gecheckt
          } else {
            console.log('[FestivalRegisterForm] Keine DB-Registration gefunden - result.success:', result.success);
            console.log('[FestivalRegisterForm] result.data:', result.data);
            
            // Wenn Cookie existiert aber keine DB-Daten, dann Cookie ungültig machen
            if (hasCookieSet) {
              console.log('[FestivalRegisterForm] Cookie vorhanden aber keine DB-Daten - entferne Cookie');
              if (setCookies) Cookies.remove('festival_registered');
              setHasCookie(false);
            }
            
            // Fallback: localStorage verwenden falls vorhanden
            if (localStorageData) {
              console.log('[FestivalRegisterForm] Verwende localStorage als Fallback');
              setForm({ ...defaultData, ...localStorageData });
              if (hasCookieSet) {
                setHasCookie(true);
                setStep(steps.length - 1); // Zur Bestätigungsseite wenn Cookie da war
              }
            } else {
              console.log('[FestivalRegisterForm] Kein localStorage Fallback verfügbar');
            }
            
            hasAlreadyCheckedRef.current = true; // ✅ Markiere als gecheckt (auch bei no-result)
          }
        } catch (error) {
          console.error('[FestivalRegisterForm] Fehler beim DB-Check (vermutlich offline):', error);
          console.error('[FestivalRegisterForm] Error Stack:', (error as any)?.stack);
          
          // 🚨 OFFLINE-MODUS: DB-Fehler → sofort localStorage verwenden
          console.log('[FestivalRegisterForm] 🚨 OFFLINE-MODUS: Verwende localStorage');
          
          if (localStorageData) {
            console.log('[FestivalRegisterForm] OFFLINE: localStorage-Daten gefunden, lade Formular');
            setForm({ ...defaultData, ...localStorageData });
            
            // Wenn Cookie da war, zur Bestätigungsseite
            if (hasCookieSet) {
              setHasCookie(true);
              setStep(steps.length - 1);
              setExistingRegistration({ formData: localStorageData }); // Fake Registration für UI
            }
          } else {
            console.log('[FestivalRegisterForm] OFFLINE: Kein localStorage verfügbar - zeige leeres Formular');
            
            // Wenn Cookie da war aber keine Daten, Cookie entfernen
            if (hasCookieSet) {
              console.log('[FestivalRegisterForm] OFFLINE: Cookie entfernen da keine Daten');
              if (setCookies) Cookies.remove('festival_registered');
              setHasCookie(false);
            }
          }
          
          hasAlreadyCheckedRef.current = true; // ✅ Markiere als gecheckt (auch bei error)
        }
      } else {
        console.log('[FestivalRegisterForm] Keine deviceId verfügbar');
        
        // Auch ohne deviceId localStorage checken
        if (localStorageData) {
          console.log('[FestivalRegisterForm] Keine deviceId aber localStorage verfügbar');
          setForm({ ...defaultData, ...localStorageData });
        }
        
        hasAlreadyCheckedRef.current = true; // ✅ Markiere als gecheckt
      }
      
      setIsLoaded(true);
      console.log('[FestivalRegisterForm] checkRegistrationStatus beendet');
    };

    checkRegistrationStatus();
  }, [deviceId, setCookies, skipRegistrationCheck]); // hasCookie nicht in Dependencies!

  // LocalStorage: Nach erfolgreichem Absenden NICHT mehr löschen!
  // LocalStorage wird erst beim Klick auf "Neue Anmeldung" gelöscht
  const handleNewRegistration = () => {
    setForm(defaultData);
    setStep(0);
    setFromDay(0);
    setToDay(FESTIVAL_DAYS.length - 1);
    if (setCookies) Cookies.remove('festival_registered');
    setHasCookie(false);
    setExistingRegistration(null);
    try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch (e) { /* ignore */ }
    
    // ✅ RACE CONDITION FIX: Reset Check-Flag für neue Registration
    hasAlreadyCheckedRef.current = false;
  };

  // Steps-Definition
  const steps = [
    {
      label: 'Einführung',
      content: (
        <FormStep>
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-semibold text-[#460b6c] text-center flex items-center gap-2">
              <SwatchBook className="inline-block w-8 h-8 text-[#ff9900]" />
              Festival-Anmeldung
            </h1>
            <p className="text-lg text-center text-[#460b6c]/80">
              Willkommen! Diese Anmeldung hilft uns, alles für das Festival zu organisieren und dir den bestmöglichen Aufenthalt zu bieten.
            </p>
            <div className="flex flex-col items-center gap-2 mt-4">
              <span className="text-sm text-[#460b6c]/70 text-center flex items-center gap-1">
                <ChevronRight className="inline-block w-4 h-4 text-[#ff9900]" />
                Nutze den Button rechts, um zu starten
              </span>
            </div>
          </div>
        </FormStep>
      ),
      isValid: true,
    },
    {
      label: 'Name',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <User className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Bitte gib deinen Namen ein.</span>
          </div>
          <InputField
            label="Name"
            id="name"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            required
            autoFocus
          />
        </FormStep>
      ),
      isValid: !!form.name.trim(),
    },
    {
      label: 'Zeitraum',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <SwatchBook className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Von wann bis wann bist du da?</span>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-xs mb-1">Von</span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={fromDay === 0} onClick={() => setFromDay(d => Math.max(0, d - 1))} className="p-1"><ChevronLeft /></button>
                  <select value={fromDay} onChange={e => setFromDay(Number(e.target.value))} className="rounded border px-2 py-1">
                    {FESTIVAL_DAYS.map((d, i) => i <= toDay && <option key={d} value={i}>{d}</option>)}
                  </select>
                  <button type="button" disabled={fromDay === toDay} onClick={() => setFromDay(d => Math.min(toDay, d + 1))} className="p-1"><ChevronRight /></button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs mb-1">Bis</span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={toDay === fromDay} onClick={() => setToDay(d => Math.max(fromDay, d - 1))} className="p-1"><ChevronLeft /></button>
                  <select value={toDay} onChange={e => setToDay(Number(e.target.value))} className="rounded border px-2 py-1">
                    {FESTIVAL_DAYS.map((d, i) => i >= fromDay && <option key={d} value={i}>{d}</option>)}
                  </select>
                  <button type="button" disabled={toDay === FESTIVAL_DAYS.length - 1} onClick={() => setToDay(d => Math.min(FESTIVAL_DAYS.length - 1, d + 1))} className="p-1"><ChevronRight /></button>
                </div>
              </div>
            </div>
          </div>
        </FormStep>
      ),
      isValid: fromDay <= toDay,
      onNext: () => setForm(f => ({ ...f, days: Array.from({ length: toDay - fromDay + 1 }, (_, i) => i + fromDay) })),
    },
    {
      label: 'Finanzkonzept',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <Euro className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">So funktioniert die Finanzierung des Festivals.</span>
          </div>
          <div className="flex flex-col gap-4 w-full items-center">
            <h3 className="text-lg font-semibold text-[#460b6c] mb-2 text-center">Wie funktioniert das Finanzkonzept?</h3>
            <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-3 py-2 text-[#460b6c] w-full flex flex-col gap-1 mx-auto text-sm">
              <p>
                Das Festival wird gemeinschaftlich und solidarisch finanziert. Wir möchten allen ermöglichen, teilzunehmen – unabhängig von den eigenen finanziellen Möglichkeiten. Deshalb gibt es verschiedene Preisoptionen:
              </p>
              <ul className="list-disc pl-5">
                <li><b>Solipreis</b>: Empfohlener Beitrag, der hilft, alle Kosten zu decken und das Festival langfristig zu sichern.</li>
                <li><b>Reduziert</b>: Für alle, die sich den vollen Beitrag nicht leisten können.</li>
                <li><b>Kostenlos</b>: Nach Absprache, falls du gerade gar nichts zahlen kannst – sprich uns einfach an!</li>
              </ul>
              <p>
                Alle Beiträge fließen direkt in die Organisation, Infrastruktur und das Programm. Transparenz ist uns wichtig – bei Fragen sprich uns gerne an!
              </p>
            </div>
          </div>
        </FormStep>
      ),
      isValid: true,
    },
    {
      label: 'Preisoption',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <Euro className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Wie viel möchtest du zahlen?</span>
          </div>
          <RadioGroupField
            label="Finanzkonzept"
            value={form.priceOption}
            onChange={v => setForm(f => ({ ...f, priceOption: v as "full" | "reduced" | "free" }))}
            options={[
              { value: "full", label: 'Solipreis||Empfohlen' },
              { value: "reduced", label: 'Reduziert||' },
              { value: "free", label: 'Kostenlos||mit Absprache' },
            ]}
            id="priceOption"
          />
        </FormStep>
      ),
      isValid: !!form.priceOption,
    },
    {
      label: 'Anreise',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <Train className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Wie reist du an?</span>
          </div>
          <RadioGroupField
            label="Ich reise an mit:"
            value={form.travelType}
            onChange={v => setForm(f => ({ ...f, travelType: v as "zug" | "auto" | "fahrrad" | "andere" }))}
            options={[
              { value: "zug", label: "Zug", icon: <Train className="inline-block w-5 h-5 text-[#ff9900]" /> },
              { value: "auto", label: "Auto", icon: <CarIcon className="inline-block w-5 h-5 text-[#ff9900]" /> },
              { value: "fahrrad", label: "Fahrrad", icon: <Bike className="inline-block w-5 h-5 text-[#ff9900]" /> },
              { value: "andere", label: "Unklar", icon: <HelpCircle className="inline-block w-5 h-5 text-[#ff9900]" /> },
            ]}
            id="travelType"
          />
        </FormStep>
      ),
      isValid: !!form.travelType,
    },
    {
      label: 'Sanitäter:in',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <Stethoscope className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Hast du eine Sanitätsausbildung?</span>
          </div>
          <CheckboxField
            id="isMedic"
            checked={form.isMedic}
            onChange={(v: boolean) => setForm(f => ({ ...f, isMedic: v }))}
            label="Ich bin Sanitäter:in"
          />
        </FormStep>
      ),
      isValid: true,
    },
    {
      label: 'Equipment',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <Wrench className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Hast du Equipment, das du teilen möchtest?</span>
          </div>
          <TextareaField
            label="Equipment"
            id="equipment"
            icon={<Wrench className="inline-block w-5 h-5 text-[#ff9900]" />}
            value={form.equipment}
            onChange={v => {
              if (v.length <= MAX_TEXTAREA) setForm(f => ({ ...f, equipment: v }));
            }}
            maxLength={MAX_TEXTAREA}
            placeholder="z.B. Musikanlage, Pavillon, Werkzeug ..."
          />
        </FormStep>
      ),
      isValid: true,
    },
    {
      label: 'Line-Up',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <Music className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Möchtest du etwas zum Line-Up beitragen?</span>
          </div>
          <TextareaField
            label="Line-Up"
            id="lineupContribution"
            icon={<Music className="inline-block w-5 h-5 text-[#ff9900]" />}
            value={form.lineupContribution}
            onChange={v => setForm(f => ({ ...f, lineupContribution: v }))}
            maxLength={MAX_TEXTAREA}
            placeholder="Beschreibe deinen Beitrag (optional)…"
          />
        </FormStep>
      ),
      isValid: true,
    },
    {
      label: 'Workshop',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <Hammer className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Hast du Lust, einen Workshop anzubieten?</span>
          </div>
          <TextareaField
            label="Workshop-Idee"
            id="workshop"
            icon={<Hammer className="inline-block w-5 h-5 text-[#ff9900]" />}
            value={form.wantsToOfferWorkshop}
            onChange={v => {
              if (v.length <= MAX_TEXTAREA) setForm(f => ({ ...f, wantsToOfferWorkshop: v }));
            }}
            maxLength={MAX_TEXTAREA}
            placeholder="Workshop-Idee ..."
          />
        </FormStep>
      ),
      isValid: true,
    },
    {
      label: 'Schlafpräferenz',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <Bed className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Wie möchtest du übernachten?</span>
          </div>
          <RadioGroupField
            label="Schlafpräferenz"
            value={form.sleepingPreference}
            onChange={v => setForm(f => ({ ...f, sleepingPreference: v as "bed" | "tent" | "car" }))}
            options={[
              { value: "bed", label: <span className="flex items-center gap-2"><Bed className="inline-block w-5 h-5 text-[#ff9900]" /> Bett</span>, icon: null },
              { value: "tent", label: <span className="flex items-center gap-2"><Tent className="inline-block w-5 h-5 text-[#ff9900]" /> Zelt</span>, icon: null },
              { value: "car", label: <span className="flex items-center gap-2"><CarIcon className="inline-block w-5 h-5 text-[#ff9900]" /> Auto</span>, icon: null },
            ].map(opt => opt.value === 'bed' ? { ...opt, label: 'Bett||+5€ pro Nacht', icon: <Bed className="inline-block w-5 h-5 text-[#ff9900]" /> } : opt)}
            id="sleepingPreference"
          />
        </FormStep>
      ),
      isValid: !!form.sleepingPreference,
    },
    {
      label: 'Anliegen',
      content: (
        <FormStep>
          <div className="flex flex-col gap-2 w-full items-center mb-2">
            <MessageCircle className="inline-block w-7 h-7 text-[#ff9900]" />
            <span className="text-sm text-[#460b6c]/80 text-center">Gibt es etwas, das du uns mitteilen möchtest?</span>
          </div>
          <TextareaField
            label="Anliegen"
            id="concerns"
            value={form.concerns}
            onChange={v => {
              if (v.length <= MAX_TEXTAREA) setForm(f => ({ ...f, concerns: v }));
            }}
            maxLength={MAX_TEXTAREA}
            placeholder="Dein Anliegen ..."
          />
        </FormStep>
      ),
      isValid: true,
    },
    {
      label: 'Zusammenfassung',
      content: (
        <FormStep>
           <div className="flex flex-col gap-1 w-full px-3 py-0 text-sm">
            <span className="block text-xs text-[#460b6c]/70 mb-1 text-center">Zusammenfassung</span>
            <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-3 py-2 text-[#460b6c] w-full flex flex-col gap-1 mx-auto text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Name:</span> <span className="truncate">{form.name.trim()}</span></div>
              <div className="flex items-center gap-2"><Euro className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Preis:</span> <span>{form.priceOption === 'full' ? 'Solipreis' : form.priceOption === 'reduced' ? 'Reduziert' : 'Kostenlos'}</span></div>
              <div className="flex items-center gap-2"><Bed className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Schlafplatz:</span> <span>{form.sleepingPreference === 'bed' ? 'Bett' : form.sleepingPreference === 'tent' ? 'Zelt' : 'Auto'}</span></div>
              <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Sanitäter:in:</span> <span>{form.isMedic ? 'Ja' : 'Nein'}</span></div>
              <div className="flex items-center gap-2"><CarIcon className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Anreise:</span> <span>{form.travelType === 'zug' ? 'Zug' : form.travelType === 'auto' ? 'Auto' : form.travelType === 'fahrrad' ? 'Fahrrad' : 'Unklar'}</span></div>
              <div className="flex items-center gap-2"><Bed className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Zeitraum:</span> <span>{FESTIVAL_DAYS[form.days[0]]} – {FESTIVAL_DAYS[form.days[form.days.length - 1]]}</span></div>
              {form.lineupContribution.trim() ? (
                <div className="flex items-center gap-2"><Music className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Line-Up:</span> <span className="truncate max-w-[220px]">{form.lineupContribution.length > 60 ? form.lineupContribution.slice(0, 60) + '…' : form.lineupContribution}</span></div>
              ) : null}
              {form.wantsToOfferWorkshop.trim() ? (
                <div className="flex items-center gap-2"><Hammer className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Workshop:</span> <span className="truncate max-w-[220px]">{form.wantsToOfferWorkshop.length > 60 ? form.wantsToOfferWorkshop.slice(0, 60) + '…' : form.wantsToOfferWorkshop}</span></div>
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
      ),
      isValid: true,
    },
    {
      label: 'Bestätigung',
      content: (
        <FormStep>
          <div className="flex flex-col items-center justify-center w-full">
            <MailCheck className="w-16 h-16 text-[#ff9900] mx-auto mb-4" />
            <h2 className="font-semibold text-2xl text-[#460b6c] mb-2">Du bist angemeldet!</h2>
            <p className="text-[#460b6c] text-lg mb-6">Wir freuen uns auf dich beim Festival 🎉</p>
            
            {/* NEU: Hinweis bei bestehender Registration */}
            {existingRegistration && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg w-full">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Deine Anmeldung war bereits gespeichert</span>
                </div>
                <p className="text-blue-700 text-xs mt-1">
                  Nach dem Gerätewechsel haben wir deine bestehenden Daten geladen.
                </p>
              </div>
            )}
            
            {/* Zusammenfassung auch auf der Bestätigungsseite anzeigen */}
            <div className="flex flex-col gap-1 w-full px-3 py-0 text-sm mb-6">
              <span className="block text-xs text-[#460b6c]/70 mb-1 text-center">Deine Angaben</span>
              <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-3 py-2 text-[#460b6c] w-full flex flex-col gap-1 mx-auto text-sm">
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Name:</span> <span className="truncate">{form.name.trim()}</span></div>
                <div className="flex items-center gap-2"><Euro className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Preis:</span> <span>{form.priceOption === 'full' ? 'Solipreis' : form.priceOption === 'reduced' ? 'Reduziert' : 'Kostenlos'}</span></div>
                <div className="flex items-center gap-2"><Bed className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Schlafplatz:</span> <span>{form.sleepingPreference === 'bed' ? 'Bett' : form.sleepingPreference === 'tent' ? 'Zelt' : 'Auto'}</span></div>
                <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Sanitäter:in:</span> <span>{form.isMedic ? 'Ja' : 'Nein'}</span></div>
                <div className="flex items-center gap-2"><CarIcon className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Anreise:</span> <span>{form.travelType === 'zug' ? 'Zug' : form.travelType === 'auto' ? 'Auto' : form.travelType === 'fahrrad' ? 'Fahrrad' : 'Unklar'}</span></div>
                <div className="flex items-center gap-2"><Bed className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Zeitraum:</span> <span>{FESTIVAL_DAYS[form.days[0]]} – {FESTIVAL_DAYS[form.days[form.days.length - 1]]}</span></div>
                {form.lineupContribution.trim() ? (
                  <div className="flex items-center gap-2"><Music className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Line-Up:</span> <span className="truncate max-w-[220px]">{form.lineupContribution.length > 60 ? form.lineupContribution.slice(0, 60) + '…' : form.lineupContribution}</span></div>
                ) : null}
                {form.wantsToOfferWorkshop.trim() ? (
                  <div className="flex items-center gap-2"><Hammer className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Workshop:</span> <span className="truncate max-w-[220px]">{form.wantsToOfferWorkshop.length > 60 ? form.wantsToOfferWorkshop.slice(0, 60) + '…' : form.wantsToOfferWorkshop}</span></div>
                ) : null}
                {form.equipment.trim() ? (
                  <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Equipment:</span> <span className="truncate max-w-[220px]">{form.equipment.length > 60 ? form.equipment.slice(0, 60) + '…' : form.equipment}</span></div>
                ) : null}
                {form.concerns.trim() ? (
                  <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Anliegen:</span> <span className="truncate max-w-[220px]">{form.concerns.length > 60 ? form.concerns.slice(0, 60) + '…' : form.concerns}</span></div>
                ) : null}
              </div>
            </div>
          </div>
        </FormStep>
      ),
      isValid: true,
    },
  ];

  const handleNext = () => {
    if (steps[step].onNext) steps[step].onNext();
    setStep(s => Math.min(steps.length - 1, s + 1));
    
    // Keyboard schließen bei Weiter
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Nach oben scrollen
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handlePrev = () => {
    setStep(s => Math.max(0, s - 1));

    // Keyboard schließen bei Zurück
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Nach oben scrollen
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Bitte gib einen gültigen Namen ein.");
      return;
    }
    
    setLoading(true);
    try {
      // DeviceID zu den Formulardaten hinzufügen
      const formDataWithDevice = {
        ...form,
        deviceId: customDeviceId || deviceId || undefined
      };
      
      const result = await registerFestival(formDataWithDevice);
      if (result.success) {
        toast.success("Anmeldung erfolgreich gespeichert!");
        
        // ✨ Custom Event für andere Komponenten dispatchen
        window.dispatchEvent(new CustomEvent('registration-updated', {
          detail: { deviceId: customDeviceId || deviceId, registrationData: formDataWithDevice }
        }));
        window.dispatchEvent(new CustomEvent('user-logged-in', {
          detail: { deviceId: customDeviceId || deviceId, userName: formDataWithDevice.name }
        }));
        
        if (onRegister) onRegister(formDataWithDevice);
        if (setCookies) Cookies.set('festival_registered', 'true', { expires: 365 });
        setStep(steps.length - 1);
        setHasCookie(true);
        try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formDataWithDevice)); } catch (e) { /* ignore */ }
      } else {
        toast.error(result.error || "Fehler beim Speichern der Anmeldung.");
      }
    } catch (err) {
      toast.error("Fehler beim Speichern der Anmeldung.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA') return;
      if (step < steps.length - 1) {
        e.preventDefault();
        if (steps[step].isValid) handleNext();
      }
    }
  };
  
  // Swipe Handler für Weiter/Zurück
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (step < steps.length - 1 && steps[step].isValid && step !== steps.length - 2) {
        handleNext();
      }
    },
    onSwipedRight: () => {
      if (step > 0 && step !== steps.length - 1) {
        handlePrev();
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 50,
  });

  // Tabbar ausblenden, wenn auf Bestätigungsseite
  useEffect(() => {
    const tabbar = document.getElementById('tabbar');
    if (step === steps.length - 1 && tabbar) {
      tabbar.style.display = 'none';
    } else if (tabbar) {
      tabbar.style.display = '';
    }
    return () => {
      if (tabbar) tabbar.style.display = '';
    };
  }, [step, steps.length]);

  // Bestimmung, ob wir auf der Zusammenfassungsseite sind
  const isSummaryStep = step === steps.length - 2;
  const isConfirmationStep = step === steps.length - 1;

  return (
    <div 
      className={`fixed left-0 right-0 bottom-0 ${!isMobile ? 'top-16' : 'top-0'} flex flex-col bg-white overflow-hidden`}
      {...(isConfirmationStep ? {} : swipeHandlers)}
    >
      {/* Header mit Progressbar & Label - nur anzeigen, wenn nicht auf der Bestätigungsseite */}
      {!isConfirmationStep && (
        <div className="p-4 border-b bg-white sticky top-0 z-10 shadow-sm">
          <div className="w-full max-w-xs mx-auto">
            {/* Progressbar */}
            <div className="flex justify-between w-full gap-1 mb-2">
              {steps.map((s, i) => (
                <div
                  key={s.label}
                  className={`h-1 rounded-full flex-1 transition-colors ${i <= step ? 'bg-[#ff9900]' : 'bg-gray-300'}`} 
                />
              ))}
            </div>
            {/* Step Label */}
            <h2 className="font-semibold text-center text-lg text-[#460b6c]">{steps[step].label}</h2>
            {/* Swipe-Hinweis */}
            {step > 0 && step < steps.length - 2 && !isKeyboardVisible && (
              <div className="flex items-center justify-center mt-2 text-xs text-gray-400 gap-1">
                <ArrowLeft size={12} /> Wischen zum Navigieren <ArrowRight size={12} />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Seitliche Navigation Buttons - nur auf mobilen Geräten und nicht auf Bestätigung/Zusammenfassung */}
      {isMobile && !isConfirmationStep && (
        <>
          <div className="fixed left-0 top-0 bottom-0 z-30 pointer-events-none flex items-center">
            {step > 0 && (
              <Button
                type="button"
                onClick={handlePrev}
                size="sm"
                className="h-14 w-10 rounded-r-full flex items-center justify-center p-0 ml-1 text-white bg-[#ff9900] shadow-md hover:bg-[#ff9900]/90 pointer-events-auto"
              >
                <ChevronLeft size={24} />
              </Button>
            )}
          </div>
          {!isSummaryStep && (
          <div className="fixed right-0 top-0 bottom-0 z-30 pointer-events-none flex items-center">
            {steps[step].isValid && (
              <Button
                type="button"
                onClick={handleNext}
                size="sm"
                className="h-14 w-10 rounded-l-full flex items-center justify-center p-0 mr-1 text-white bg-[#ff9900] shadow-md hover:bg-[#ff9900]/90 pointer-events-auto"
              >
                <ChevronRight size={24} />
              </Button>
            )}
          </div>
          )}
        </>
      )}
      
      {/* Scroll-Container für den Formular-Inhalt */}
      <div 
        ref={contentRef}
        className={`flex-1 overflow-auto flex items-center justify-center px-4 py-6 ${!isConfirmationStep ? 'pb-56' : 'pb-6'} ${!isMobile ? 'pt-8' : ''}`}
      >
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center">
          {isConfirmationStep ? (
            // Final screen - keine Form mehr nötig
            <div className="flex flex-col items-center justify-center w-full">
              <MailCheck className="w-16 h-16 text-[#ff9900] mx-auto mb-4" />
              <h2 className="font-semibold text-2xl text-[#460b6c] mb-2">Du bist angemeldet!</h2>
              <p className="text-[#460b6c] text-lg mb-6">Wir freuen uns auf dich beim Festival 🎉</p>
              
              {/* NEU: Hinweis bei bestehender Registration */}
              {existingRegistration && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg w-full">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Deine Anmeldung war bereits gespeichert</span>
                  </div>
                  <p className="text-blue-700 text-xs mt-1">
                    Nach dem Gerätewechsel haben wir deine bestehenden Daten geladen.
                  </p>
                </div>
              )}
              
              {/* Zusammenfassung auch auf der Bestätigungsseite anzeigen */}
              <div className="flex flex-col gap-1 w-full px-3 py-0 text-sm mb-6">
                <span className="block text-xs text-[#460b6c]/70 mb-1 text-center">Deine Angaben</span>
                <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-3 py-2 text-[#460b6c] w-full flex flex-col gap-1 mx-auto text-sm">
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Name:</span> <span className="truncate">{form.name.trim()}</span></div>
                  <div className="flex items-center gap-2"><Euro className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Preis:</span> <span>{form.priceOption === 'full' ? 'Solipreis' : form.priceOption === 'reduced' ? 'Reduziert' : 'Kostenlos'}</span></div>
                  <div className="flex items-center gap-2"><Bed className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Schlafplatz:</span> <span>{form.sleepingPreference === 'bed' ? 'Bett' : form.sleepingPreference === 'tent' ? 'Zelt' : 'Auto'}</span></div>
                  <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Sanitäter:in:</span> <span>{form.isMedic ? 'Ja' : 'Nein'}</span></div>
                  <div className="flex items-center gap-2"><CarIcon className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Anreise:</span> <span>{form.travelType === 'zug' ? 'Zug' : form.travelType === 'auto' ? 'Auto' : form.travelType === 'fahrrad' ? 'Fahrrad' : 'Unklar'}</span></div>
                  <div className="flex items-center gap-2"><Bed className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Zeitraum:</span> <span>{FESTIVAL_DAYS[form.days[0]]} – {FESTIVAL_DAYS[form.days[form.days.length - 1]]}</span></div>
                  {form.lineupContribution.trim() ? (
                    <div className="flex items-center gap-2"><Music className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Line-Up:</span> <span className="truncate max-w-[220px]">{form.lineupContribution.length > 60 ? form.lineupContribution.slice(0, 60) + '…' : form.lineupContribution}</span></div>
                  ) : null}
                  {form.wantsToOfferWorkshop.trim() ? (
                    <div className="flex items-center gap-2"><Hammer className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Workshop:</span> <span className="truncate max-w-[220px]">{form.wantsToOfferWorkshop.length > 60 ? form.wantsToOfferWorkshop.slice(0, 60) + '…' : form.wantsToOfferWorkshop}</span></div>
                  ) : null}
                  {form.equipment.trim() ? (
                    <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Equipment:</span> <span className="truncate max-w-[220px]">{form.equipment.length > 60 ? form.equipment.slice(0, 60) + '…' : form.equipment}</span></div>
                  ) : null}
                  {form.concerns.trim() ? (
                    <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#ff9900]" /><span className="font-medium">Anliegen:</span> <span className="truncate max-w-[220px]">{form.concerns.length > 60 ? form.concerns.slice(0, 60) + '…' : form.concerns}</span></div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <form 
              ref={formRef} 
              onSubmit={handleFinalSubmit}
              onKeyDown={handleFormKeyDown}
            >
              {steps[step].content}
              
              {/* Bestätigungsknopf auf der Zusammenfassungsseite - Grün und mit Checkmark */}
              {isSummaryStep && isMobile && (
                <div className="mt-6 mb-10">
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg h-12 font-medium text-base mt-6 flex items-center justify-center gap-2"
                  >
                    {loading ? "Wird gespeichert..." : (
                      <>
                        <Check size={20} />
                        Bestätigen
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
      
      {/* Footer mit Navigation - Desktop only */}
      {!isMobile && !isConfirmationStep && (
        <div className="p-2 border-t bg-white z-10 fixed bottom-0 left-0 right-0 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
           <div className="w-full max-w-sm mx-auto flex gap-3">
            <Button
              type="button"
              onClick={handlePrev}
              disabled={step === 0}
              variant="outline"
              className={`flex-1 rounded-lg font-medium h-12 text-[#ff9900] border-[#ff9900]`}
            >
              Zurück
            </Button>
            
            {/* Wenn auf Zusammenfassungsseite, dann grüner Bestätigungs-Button mit Checkmark */}
            {isSummaryStep ? (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg h-12 font-medium flex items-center justify-center gap-2"
              >
                {loading ? "Wird gespeichert..." : (
                  <>
                    <Check size={20} />
                    Bestätigen
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!steps[step].isValid}
                className={`flex-1 bg-[#ff9900] text-white rounded-lg font-medium h-12`}
              >
                Weiter
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}