import React from 'react';
import { fetchActivitiesData } from './actions/fetchActivitiesData';
import ActivityManagerClient from './ActivityManagerClient';

/**
 * Server Component für den ActivityManager
 * Lädt initiale Daten server-side und übergibt sie an den Client
 * Wird vom PWAContainer verwendet
 */
export default function ActivityManagerServer({ initialData }: { initialData: any }) {
  return (
    <ActivityManagerClient 
      initialData={initialData}
    />
  );
} 