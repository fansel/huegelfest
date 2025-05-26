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
  priceOption: 'full' | 'reduced' | 'free';
  isMedic: boolean;
  travelType: 'zug' | 'auto' | 'fahrrad' | 'andere';
  equipment: string;
  concerns: string;
  wantsToOfferWorkshop: string;
  sleepingPreference: 'bed' | 'tent' | 'car';
  lineupContribution: string;
  paid: boolean;
  checkedIn: boolean;
}

export const FESTIVAL_DAYS = ["31.07.", "01.08.", "02.08.", "03.08."]; 