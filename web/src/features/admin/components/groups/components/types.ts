import { getCentralFestivalDays } from '@/shared/services/festivalDaysService';
import { convertToLegacyFormat } from '@/shared/utils/festivalDaysUtils';

export type TabType = 'groups' | 'users' | 'registrations' | 'magic-codes';

export interface User {
  deviceId: string;
  name: string;
  groupId?: string;
  groupName?: string;
  isRegistered: boolean;
  registrationId?: string;
  userId?: string;
  createdAt?: Date;
  lastActivity?: Date;
}

export interface RegistrationWithId {
  _id: string;
  createdAt: string;
  name: string;
  days: number[];
  isMedic: boolean;
  travelType: 'zug' | 'auto' | 'fahrrad' | 'andere';
  equipment: string;
  concerns: string;
  wantsToOfferWorkshop: string;
  sleepingPreference: 'bed' | 'tent' | 'car';
  lineupContribution: string;
  paid: boolean;
  checkedIn: boolean;
  canStaySober: boolean;
  wantsAwareness: boolean;
  programContribution: string;
  hasConcreteIdea: boolean;
  wantsKitchenHelp: boolean;
  allergies: string;
  allowsPhotos: boolean;
  contactType: 'phone' | 'telegram' | 'none';
  contactInfo: string;
}

export interface Group {
  _id: string;
  name: string;
  color: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  name: string;
  availability: Record<string, boolean>;
}

export interface CreateGroupData {
  name: string;
  color: string;
}

export interface UpdateGroupData {
  name?: string;
  color?: string;
  members?: GroupMember[];
}

export interface WorkingGroup {
  _id: string;
  name: string;
  color: string;
  members: WorkingGroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkingGroupMember {
  name: string;
}

export interface CreateWorkingGroupData {
  name: string;
  color: string;
}

export interface UpdateWorkingGroupData {
  name?: string;
  color?: string;
  members?: WorkingGroupMember[];
}

/**
 * Holt die aktuellen Festival-Tage aus der zentralen Verwaltung
 * Diese Funktion muss in einer Server-Umgebung aufgerufen werden
 */
export async function getFestivalDaysForGroups(): Promise<string[]> {
  try {
    const centralDays = await getCentralFestivalDays();
    return convertToLegacyFormat(centralDays);
  } catch (error) {
    console.error('[getFestivalDaysForGroups] Fehler beim Laden der Festival-Tage:', error);
    // Fallback zu hardcoded Werten
    return ["31.07.", "01.08.", "02.08.", "03.08."];
  }
}

// Deprecated: Verwende getFestivalDaysForGroups() stattdessen
// export const FESTIVAL_DAYS = ["31.07.", "01.08.", "02.08.", "03.08."]; 