'use client';

import dynamic from 'next/dynamic';

// Dynamisch importierte Komponenten die useAuth verwenden
const PWAPreloadData = dynamic(() => import('./PWAPreloadData').then(mod => ({ default: mod.PWAPreloadData })), { ssr: false });
const AutoPushActivator = dynamic(() => import('@/features/push/components/AutoPushActivator'), { ssr: false });

export default function ClientOnlyWrapper() {
  return (
    <>
      <PWAPreloadData />
      <AutoPushActivator />
    </>
  );
} 