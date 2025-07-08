'use client';

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "react-hot-toast";
import { useDeviceContext } from "@/shared/contexts/DeviceContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useCentralFestivalDays } from '@/shared/hooks/useCentralFestivalDays';
import { ShadowUserBlock } from '@/shared/components/ShadowUserBlock';
import type { FestivalRegisterData } from './steps/types';
import { defaultData } from './steps/types';

export interface FestivalRegisterFormProps {
  onRegister?: (data: FestivalRegisterData) => void;
  setCookies?: boolean;
  skipRegistrationCheck?: boolean;
}

export default function FestivalRegisterForm({ onRegister, setCookies = true, skipRegistrationCheck = false }: FestivalRegisterFormProps) {
  const { deviceType } = useDeviceContext();
  const { user, isLoading: authLoading } = useAuth();
  const { data: centralFestivalDays, loading: festivalDaysLoading } = useCentralFestivalDays();
  const isMobile = deviceType === "mobile";
  
  // Convert central festival days to the legacy format that existing registrations expect
  const FESTIVAL_DAYS = centralFestivalDays.map(day => {
    const date = new Date(day.date);
    const dayNum = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dayNum}.${month}.`;
  });
  
  // ✅ Shadow User Check - Shadow Users sehen die Anmeldung nicht, außer bei Nachmeldung
  if (!skipRegistrationCheck && user && (user as any).isShadowUser) {
    return <ShadowUserBlock isMobile={isMobile} />;
  }
  
  const [form, setForm] = useState<FestivalRegisterData>(defaultData);
  const [loading, setLoading] = useState(false);

  // ... existing code ...
} 