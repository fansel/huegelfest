"use client";

import { useState, useEffect, useCallback } from 'react';
import { getRegistrations } from '@/features/registration/actions/getRegistrations';

interface RegistrationWithId {
  _id: string;
  createdAt: string;
  name: string;
  days: number[];
  isMedic: boolean;
  travelType: 'zug' | 'auto' | 'fahrrad' | 'andere';
  equipment: string;
  concerns: string;
  wantsToOfferWorkshop: string;
  sleepingPreference: 'bed' | 'tent' | 'car';
  lineupContribution: string;
  paid: boolean;
  checkedIn: boolean;
  canStaySober: boolean;
  wantsAwareness: boolean;
  programContribution: string;
  hasConcreteIdea: boolean;
  wantsKitchenHelp: boolean;
  allergies: string;
  allowsPhotos: boolean;
  contactType: 'phone' | 'telegram' | 'none';
  contactInfo: string;
}

interface UseRegistrationsReturn {
  registrations: RegistrationWithId[];
  loading: boolean;
  error: string | null;
  refreshRegistrations: (newData?: RegistrationWithId[] | ((prev: RegistrationWithId[]) => RegistrationWithId[])) => void;
}

export function useRegistrations(): UseRegistrationsReturn {
  const [registrations, setRegistrations] = useState<RegistrationWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      console.error('[useRegistrations] Fehler beim Laden:', err);
      setError(err.message || 'Fehler beim Laden der Registrierungen');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRegistrations = useCallback((newData?: RegistrationWithId[] | ((prev: RegistrationWithId[]) => RegistrationWithId[])) => {
    if (newData) {
      if (typeof newData === 'function') {
        setRegistrations(newData);
      } else {
        setRegistrations(newData);
      }
    } else {
      loadRegistrations();
    }
  }, [loadRegistrations]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  return {
    registrations,
    loading,
    error,
    refreshRegistrations
  };
} 