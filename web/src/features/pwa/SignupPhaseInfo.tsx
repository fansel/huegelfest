import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { ShadowUserBlock } from '@/shared/components/ShadowUserBlock';
import FestivalRegisterForm from '../registration/FestivalRegisterForm';

const SignupPhaseInfo: React.FC = () => {
  const { user } = useAuth();
  
  // ✅ Shadow User Check - Shadow Users sehen die Anmeldung nicht
  if (user && (user as any).isShadowUser) {
    return <ShadowUserBlock className="flex-1 min-h-0" />;
  }
  
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <FestivalRegisterForm />
    </div>
  );
};

export default SignupPhaseInfo;

