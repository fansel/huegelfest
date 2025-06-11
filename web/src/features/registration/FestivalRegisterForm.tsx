"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "react-hot-toast";
import {
  MailCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle,
} from 'lucide-react';
import { registerFestival, checkRegistrationStatusAction } from './actions/register';
import { useDeviceContext } from "@/shared/contexts/DeviceContext";
import { useAuth } from "@/features/auth/AuthContext";
import Cookies from 'js-cookie';
import { useFestivalDays } from '@/shared/hooks/useFestivalDays';
import { ShadowUserBlock } from '@/shared/components/ShadowUserBlock';
import type { FestivalRegisterData, FestivalRegisterDataWithStatus } from './components/steps/types';
import { defaultData } from './components/steps/types';

// Import step components
import {
  IntroStep,
  NameStep,
  EmailPasswordStep,
  TimeRangeStep,
  FinanceStep,
  TravelStep,
  SoberDrivingStep,
  AwarenessStep,
  PhotosStep,
  ProgramStep,
  LineupStep,
  KitchenStep,
  AllergiesStep,
  EquipmentStep,
  SleepingStep,
  MedicStep,
  ConcernsStep,
  SummaryStep,
  useKeyboardVisible,
  useAutoScrollOnFocus,
  ContactStep,
} from './components/steps';

import type { StepConfig } from './components/steps/types';

import { registerWithAccount } from './actions/registerWithAccount';

export interface FestivalRegisterFormProps {
  onRegister?: (data: FestivalRegisterData & { username?: string, password?: string }) => void;
  setCookies?: boolean;
  skipRegistrationCheck?: boolean;
}

const LOCAL_STORAGE_KEY = 'festival_register_form';

export default function FestivalRegisterForm({ onRegister, setCookies = true, skipRegistrationCheck = false }: FestivalRegisterFormProps) {
  const { deviceType } = useDeviceContext();
  const { user, isLoading: authLoading, refreshSession } = useAuth();
  const { festivalDays: FESTIVAL_DAYS, loading: festivalDaysLoading } = useFestivalDays();
  const isMobile = deviceType === "mobile";
  
  // ✅ Shadow User Check - Shadow Users sehen die Anmeldung nicht, außer bei Nachmeldung
  if (!skipRegistrationCheck && user && (user as any).isShadowUser) {
    return <ShadowUserBlock isMobile={isMobile} />;
  }
  
  const [form, setForm] = useState<FestivalRegisterData>(defaultData);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [fromDay, setFromDay] = useState(0);
  const [toDay, setToDay] = useState(FESTIVAL_DAYS.length > 0 ? FESTIVAL_DAYS.length - 1 : 0);
  const formRef = useRef<HTMLFormElement>(null);
  const [hasCookie, setHasCookie] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isKeyboardVisible = useKeyboardVisible();
  const [isLoaded, setIsLoaded] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<FestivalRegisterDataWithStatus | null>(null);
  
  // Password state for account creation
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailPasswordStepValid, setEmailPasswordStepValid] = useState(false);
  
  // ✅ RACE CONDITION FIX: Verhindere mehrfache Registration-Checks
  const hasAlreadyCheckedRef = useRef(false);
  
  // Verwende den Auto-Scroll-Hook
  useAutoScrollOnFocus(contentRef, isKeyboardVisible);

  // Steps-Definition mit neuen Komponenten
  const steps: StepConfig[] = [
    {
      label: 'Einführung',
      content: <IntroStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Name',
      content: <NameStep form={form} setForm={setForm} />,
      isValid: !!form.name.trim(),
    },
    // Email und Passwort immer bei Nachmeldung, sonst nur wenn nicht eingeloggt
    ...(skipRegistrationCheck ? [{
      label: 'Email und Passwort',
      content: (
        <EmailPasswordStep 
          form={form} 
          setForm={setForm} 
          password={password} 
          setPassword={setPassword} 
          confirmPassword={confirmPassword} 
          setConfirmPassword={setConfirmPassword}
          setIsValid={setEmailPasswordStepValid}
        />
      ),
      isValid: emailPasswordStepValid,
    }] : !user ? [{
      label: 'Email und Passwort',
      content: (
        <EmailPasswordStep 
          form={form} 
          setForm={setForm} 
          password={password} 
          setPassword={setPassword} 
          confirmPassword={confirmPassword} 
          setConfirmPassword={setConfirmPassword}
          setIsValid={setEmailPasswordStepValid}
        />
      ),
      isValid: emailPasswordStepValid,
    }] : []),
    {
      label: 'Kontakt',
      content: <ContactStep form={form} setForm={setForm} />,
      isValid: form.contactType === 'none' || ((form.contactType === 'phone' || form.contactType === 'telegram') && !!form.contactInfo.trim()),
    },
    {
      label: 'Zeitraum',
      content: <TimeRangeStep form={form} setForm={setForm} fromDay={fromDay} toDay={toDay} setFromDay={setFromDay} setToDay={setToDay} />,
      isValid: fromDay <= toDay,
      onNext: () => setForm(f => ({ ...f, days: Array.from({ length: toDay - fromDay + 1 }, (_, i) => i + fromDay) })),
    },
    {
      label: 'Finanzkonzept',
      content: <FinanceStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Anreise',
      content: <TravelStep form={form} setForm={setForm} />,
      isValid: !!form.travelType,
    },
    {
      label: 'Nüchtern fahren',
      content: <SoberDrivingStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Awareness',
      content: <AwarenessStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Fotos',
      content: <PhotosStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Programmpunkt',
      content: <ProgramStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Line-Up',
      content: <LineupStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Küche',
      content: <KitchenStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Allergien',
      content: <AllergiesStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Equipment',
      content: <EquipmentStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Schlafpräferenz',
      content: <SleepingStep form={form} setForm={setForm} />,
      isValid: !!form.sleepingPreference,
    },
    {
      label: 'Sanitäter:in',
      content: <MedicStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Anliegen',
      content: <ConcernsStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Zusammenfassung',
      content: <SummaryStep form={form} setForm={setForm} />,
      isValid: true,
    },
    {
      label: 'Bestätigung',
      content: (
          <div className="flex flex-col items-center justify-center w-full">
            <MailCheck className="w-16 h-16 text-[#ff9900] mx-auto mb-4" />
            <h2 className="font-semibold text-2xl text-[#460b6c] mb-2">Du bist angemeldet!</h2>
            <p className="text-[#460b6c] text-lg mb-4 text-center">Wir freuen uns auf dich, <strong>{form.name}</strong>! 🎉</p>
            <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 text-center">
              <p className="text-[#460b6c] text-sm">
                Deine Anmeldung wurde erfolgreich gespeichert.<br/>
                Du kannst die App jetzt weiter nutzen.
              </p>
            </div>
          </div>
      ),
      isValid: true,
    },
  ];
  
  // Ensure step stays within valid bounds
  useEffect(() => {
    if (steps.length > 0 && (step < 0 || step >= steps.length)) {
      console.log('[FestivalRegisterForm] Korrigiere ungültigen Step-Index:', { step, stepsLength: steps.length });
      setStep(Math.min(Math.max(0, step), steps.length - 1));
    }
  }, [step, steps.length]);

  // Initialize toDay when FESTIVAL_DAYS loads
  useEffect(() => {
    if (FESTIVAL_DAYS.length > 0 && toDay === 0) {
      setToDay(FESTIVAL_DAYS.length - 1);
    }
  }, [FESTIVAL_DAYS, toDay]);
  
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

  // NEU: Session-basierter Registration-Check
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      // Frühe Rückkehr wenn Registration-Check übersprungen werden soll
      if (skipRegistrationCheck) {
        console.log('[FestivalRegisterForm] Registration-Check übersprungen (skipRegistrationCheck=true)');
        setIsLoaded(true);
        hasAlreadyCheckedRef.current = true;
        return;
      }

      // Warte auf Auth-Loading
      if (authLoading) {
        console.log('[FestivalRegisterForm] Warte auf Auth-Loading...');
        return;
      }

      // ✅ RACE CONDITION FIX: Wenn bereits gecheckt und Registration geladen, dann abbrechen
      if (hasAlreadyCheckedRef.current && existingRegistration) {
        console.log('[FestivalRegisterForm] Registration bereits geladen - überspringe Check');
        return;
      }
      
      console.log('[FestivalRegisterForm] Starte Registration-Check für User:', user?.id);
      
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
      
      // 3. Netzwerk-Check: Session-basierte Prüfung
      if (user) {
        try {
          console.log('[FestivalRegisterForm] Prüfe Registrierungsstatus für User:', user.id);
          
          const statusResult = await checkRegistrationStatusAction();
          console.log('[FestivalRegisterForm] Registrierungsstatus:', statusResult);
          
          if (statusResult.isRegistered && statusResult.name) {
            console.log('[FestivalRegisterForm] User ist angemeldet:', statusResult.name);
            
            // Setze nur den Namen - keine vollständigen Formulardaten mehr!
            setForm(prev => ({ 
              ...prev, 
              name: statusResult.name || 'Angemeldet' 
            }));
            
            // Setze Cookie falls noch nicht vorhanden
            if (setCookies && !hasCookieSet) {
              Cookies.set('festival_registered', 'true', { expires: 365 });
            }
            setHasCookie(true);
            setStep(steps.length - 1); // Direkt zur Bestätigungsseite
            
            // Fake Registration Objekt für UI-Kompatibilität
            setExistingRegistration({ 
              ...defaultData,
              name: statusResult.name || 'Angemeldet',
              isRegistered: true 
            });
            
            hasAlreadyCheckedRef.current = true;
          } else {
            console.log('[FestivalRegisterForm] User nicht angemeldet');
            
            // Wenn Cookie existiert aber nicht angemeldet, dann Cookie ungültig machen
            if (hasCookieSet) {
              console.log('[FestivalRegisterForm] Cookie vorhanden aber nicht angemeldet - entferne Cookie');
              if (setCookies) Cookies.remove('festival_registered');
              setHasCookie(false);
            }
            
            // Fallback: localStorage verwenden falls vorhanden (nur für Offline-Modus)
            if (localStorageData) {
              console.log('[FestivalRegisterForm] Verwende localStorage als Fallback für Offline-Modus');
              const typedData = localStorageData as Partial<FestivalRegisterData>;
              setForm({ ...defaultData, ...typedData });
              
              // Wenn Cookie da war, zur Bestätigungsseite
              if (hasCookieSet) {
                setHasCookie(true);
                setStep(steps.length - 1);
                setExistingRegistration({ 
                  ...defaultData,
                  name: typeof typedData.name === 'string' ? typedData.name : 'Offline-Modus',
                  isRegistered: true 
                });
              }
            }
            
            hasAlreadyCheckedRef.current = true;
          }
        } catch (error) {
          console.error('[FestivalRegisterForm] Fehler beim Status-Check (vermutlich offline):', error);
          console.error('[FestivalRegisterForm] Error Stack:', (error as any)?.stack);
          
          // 🚨 OFFLINE-MODUS: Status-Check-Fehler → localStorage verwenden
          console.log('[FestivalRegisterForm] 🚨 OFFLINE-MODUS: Verwende localStorage');
          
          if (localStorageData) {
            console.log('[FestivalRegisterForm] OFFLINE: localStorage-Daten gefunden, lade Formular');
            const typedData = localStorageData as Partial<FestivalRegisterData>;
            setForm({ ...defaultData, ...typedData });
            
            // Wenn Cookie da war, zur Bestätigungsseite
            if (hasCookieSet) {
              setHasCookie(true);
              setStep(steps.length - 1);
              setExistingRegistration({ 
                ...defaultData,
                name: typeof typedData.name === 'string' ? typedData.name : 'Offline-Modus',
                isRegistered: true 
              });
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
          
          hasAlreadyCheckedRef.current = true;
        }
      } else if (!authLoading) {
        console.log('[FestivalRegisterForm] Kein User angemeldet');
        
        // Auch ohne User localStorage checken
        if (localStorageData) {
          console.log('[FestivalRegisterForm] Kein User aber localStorage verfügbar');
          const typedData = localStorageData as Partial<FestivalRegisterData>;
          setForm({ ...defaultData, ...typedData });
        }
        
        hasAlreadyCheckedRef.current = true; // ✅ Markiere als gecheckt
      }
      
      setIsLoaded(true);
      console.log('[FestivalRegisterForm] checkRegistrationStatus beendet');
    };

    checkRegistrationStatus();
  }, [user, authLoading, setCookies, skipRegistrationCheck]); // user und authLoading in Dependencies!

  // LocalStorage: Nach erfolgreichem Absenden NICHT mehr löschen!
  // LocalStorage wird erst beim Klick auf "Neue Anmeldung" gelöscht
  const handleNewRegistration = () => {
    // Alle State-Updates synchron durchführen um Flackern zu vermeiden
    setIsLoaded(false);
    setForm(defaultData);
    setStep(0);
    setFromDay(0);
    setToDay(FESTIVAL_DAYS.length > 0 ? FESTIVAL_DAYS.length - 1 : 0);
    if (setCookies) Cookies.remove('festival_registered');
    setHasCookie(false);
    setExistingRegistration(null);
    try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch (e) { /* ignore */ }
    
    // ✅ RACE CONDITION FIX: Reset Check-Flag für neue Registration
    hasAlreadyCheckedRef.current = false;
    
    // Sofort wieder als geladen markieren, da wir eine neue Anmeldung starten
    setIsLoaded(true);
  };

  const handleNext = () => {
    if (step >= 0 && step < steps.length) {
      if (steps[step].onNext) steps[step].onNext();
      setStep(s => Math.min(steps.length - 1, s + 1));
      
      // Keyboard schließen bei Weiter
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      
      // Nach oben scrollen
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    
    // Prevent multiple submissions
    if (loading) {
      return;
    }
    
    if (!form.name.trim()) {
      toast.error("Bitte gib einen gültigen Namen ein.");
      return;
    }
    
    setLoading(true);
    try {
      // Bei Nachmeldung: Übergebe username und password an onRegister
      if (skipRegistrationCheck && onRegister) {
        if (password.length < 8) {
          toast.error("Bitte gib ein Passwort mit mindestens 8 Zeichen ein.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwörter stimmen nicht überein.");
          setLoading(false);
          return;
        }
        if (!(form as any).username?.trim()) {
          toast.error("Bitte gib einen gültigen Username ein.");
          setLoading(false);
          return;
        }
        // Email-Validierung nur wenn eine angegeben wurde
        if (form.email && !form.email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          toast.error("Bitte gib eine gültige E-Mail-Adresse ein oder lasse das Feld leer.");
          setLoading(false);
          return;
        }

        onRegister({
          ...form,
          username: (form as any).username,
          password: password
        });
        return;
      }

      let result;
      
      // Unterscheide zwischen Nachmeldung und normaler Registrierung
      if (skipRegistrationCheck) {
        // Bei Nachmeldung: Verwende registerWithAccount ohne Rücksicht auf eingeloggten User
        if (password.length < 8) {
          toast.error("Bitte gib ein Passwort mit mindestens 8 Zeichen ein.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwörter stimmen nicht überein.");
          setLoading(false);
          return;
        }
        // Email-Validierung nur wenn eine angegeben wurde
        if (form.email && !form.email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          toast.error("Bitte gib eine gültige E-Mail-Adresse ein oder lasse das Feld leer.");
          setLoading(false);
          return;
        }
        
        result = await registerWithAccount(form as FestivalRegisterData & { username: string }, password);
      } else if (user) {
        // Normale Registrierung mit eingeloggtem User
        result = await registerFestival(form);
      } else {
        // Normale Registrierung ohne User - erstelle Account
        if (password.length < 8) {
          toast.error("Bitte gib ein Passwort mit mindestens 8 Zeichen ein.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwörter stimmen nicht überein.");
          setLoading(false);
          return;
        }
        // Email-Validierung nur wenn eine angegeben wurde
        if (form.email && !form.email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          toast.error("Bitte gib eine gültige E-Mail-Adresse ein oder lasse das Feld leer.");
          setLoading(false);
          return;
        }
        
        result = await registerWithAccount(form as FestivalRegisterData & { username: string }, password);
      }
      
      if (result.success) {
        // Sofort UI-Feedback geben
        toast.success(`${skipRegistrationCheck ? 'Nachmeldung' : (user ? 'Anmeldung' : 'Account und Anmeldung')} erfolgreich gespeichert!`);
        
        // Session aktualisieren, um den neuen Login-Status zu übernehmen
        await refreshSession();

        // Sofort zur Bestätigungsseite wechseln
        setStep(steps.length - 1);
        
        // ✨ Custom Event für andere Komponenten dispatchen - nur bei normaler Registrierung
        if (!skipRegistrationCheck) {
          // Dispatch registration-updated event
          window.dispatchEvent(new CustomEvent('registration-updated', {
            detail: { userId: (result as any).user?.id || user?.id, registrationData: form }
          }));
        }
        
        if (onRegister) onRegister(form);
        if (setCookies) Cookies.set('festival_registered', 'true', { expires: 365 });
        setHasCookie(true);
        try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(form)); } catch (e) { /* ignore */ }
      } else {
        // Sofort Fehlermeldung anzeigen
        toast.error(result.error || "Fehler beim Speichern der Anmeldung.");
        // Form nicht zurücksetzen bei Fehler
      }
    } catch (err) {
      console.error('Fehler bei der Registrierung:', err);
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern der Anmeldung.");
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
        if (step >= 0 && step < steps.length && steps[step].isValid) handleNext();
      }
    }
  };

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
    >
      {/* Zeige nichts an, bis der Loading-Check abgeschlossen ist */}
      {(!isLoaded || festivalDaysLoading) ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#460b6c] text-lg">
            {festivalDaysLoading ? 'Lade Festival-Daten...' : 'Lädt...'}
          </div>
        </div>
      ) : (
        <>
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
                <h2 className="font-semibold text-center text-lg text-[#460b6c]">
                  {step >= 0 && step < steps.length ? steps[step].label : 'Laden...'}
                </h2>
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
                    className="h-12 w-6 rounded-r-full flex items-center justify-center p-0 ml-1 text-white bg-[#ff9900] shadow-md hover:bg-[#ff9900]/90 pointer-events-auto"
                  >
                    <ChevronLeft size={18} />
                  </Button>
                )}
              </div>
              {!isSummaryStep && (
              <div className="fixed right-0 top-0 bottom-0 z-30 pointer-events-none flex items-center">
                {step >= 0 && step < steps.length && steps[step].isValid && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    size="sm"
                    className="h-12 w-6 rounded-l-full flex items-center justify-center p-0 mr-1 text-white bg-[#ff9900] shadow-md hover:bg-[#ff9900]/90 pointer-events-auto"
                  >
                    <ChevronRight size={18} />
                  </Button>
                )}
              </div>
              )}
            </>
          )}
          
          {/* Main Content */}
          <div 
            ref={contentRef}
            className={`flex-1 overflow-auto flex items-center justify-center px-4 py-6 ${!isConfirmationStep ? 'pb-56' : 'pb-6'} ${!isMobile ? 'pt-8' : ''}`}
          >
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center">
              {isConfirmationStep ? (
                // Final screen - keine Form mehr nötig
                step >= 0 && step < steps.length ? steps[step].content : null
              ) : (
                <form 
                  ref={formRef} 
                  onSubmit={handleFinalSubmit}
                  onKeyDown={handleFormKeyDown}
                >
                  {step >= 0 && step < steps.length ? steps[step].content : null}
                  
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
                            {user ? 'Bestätigen' : 'Account erstellen & Bestätigen'}
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
                        {user ? 'Bestätigen' : 'Account erstellen & Bestätigen'}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!(step >= 0 && step < steps.length && steps[step].isValid)}
                    className={`flex-1 bg-[#ff9900] text-white rounded-lg font-medium h-12`}
                  >
                    Weiter
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}