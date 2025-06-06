'use client';

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "react-hot-toast";
import { useDeviceContext } from "@/shared/contexts/DeviceContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useFestivalDays } from '@/shared/hooks/useFestivalDays';
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
  const { festivalDays: FESTIVAL_DAYS, loading: festivalDaysLoading } = useFestivalDays();
  const isMobile = deviceType === "mobile";
  
  // ✅ Shadow User Check - Shadow Users sehen die Anmeldung nicht, außer bei Nachmeldung
  if (!skipRegistrationCheck && user && (user as any).isShadowUser) {
    return <ShadowUserBlock isMobile={isMobile} />;
  }
  
  const [form, setForm] = useState<FestivalRegisterData>(defaultData);
  const [loading, setLoading] = useState(false);

  // ... existing code ...
} 