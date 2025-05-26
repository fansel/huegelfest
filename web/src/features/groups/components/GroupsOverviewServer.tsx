import React from 'react';
import { fetchGroupsData } from '../actions/fetchGroupsData';
import { GroupsOverviewClient } from './GroupsOverviewClient';

/**
 * Server Component für Groups Overview - lädt initial Daten per SSR
 */
export async function GroupsOverviewServer() {
  const initialData = await fetchGroupsData();

  return <GroupsOverviewClient initialData={initialData} />;
} 