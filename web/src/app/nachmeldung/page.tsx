import React from 'react';
import { Metadata } from 'next';
import NachmeldungPage from '@/features/registration/components/NachmeldungPage';

export const metadata: Metadata = {
  title: 'Nachmeldung - Hügelfest',
  description: 'Nachmeldung für das Hügelfest nach Ende der regulären Anmeldephase'
};

// Dynamisches Rendering erzwingen, da Client-Side Auth verwendet wird
export const dynamic = 'force-dynamic';

export default function Page() {
  return <NachmeldungPage />;
}