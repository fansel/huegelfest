import React from 'react';
import { Metadata } from 'next';
import NachmeldungPage from '@/features/registration/components/NachmeldungPage';

export const metadata: Metadata = {
  title: 'Nachmeldung - Hügelfest',
  description: 'Nachmeldung für das Hügelfest nach Ende der regulären Anmeldephase'
};

export default function Page() {
  return <NachmeldungPage />;
} 