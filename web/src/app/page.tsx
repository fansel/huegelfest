import React from 'react';
import Image from 'next/image';
import { Countdown } from '@/shared/components/Countdown';
import PWAContainerServer from '@/shared/components/PWAContainerServer';

// Force dynamic rendering to handle cookies
export const dynamic = 'force-dynamic';

export default function Home() {
  return <PWAContainerServer />;
}
