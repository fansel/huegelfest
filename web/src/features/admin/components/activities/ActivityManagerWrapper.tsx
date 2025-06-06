'use client';

import React from 'react';
import ActivityManagerClient from './ActivityManagerClient';
import type { ActivitiesData } from './actions/fetchActivitiesData';

interface ActivityManagerWrapperProps {
  initialData: ActivitiesData;
}

export default function ActivityManagerWrapper({ initialData }: ActivityManagerWrapperProps) {
  return <ActivityManagerClient initialData={initialData} />;
} 