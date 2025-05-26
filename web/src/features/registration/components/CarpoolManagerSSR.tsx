import React from 'react';
import { getRidesAction } from '../actions/getRides';
import CarpoolClient from './CarpoolClient';

interface Ride {
  _id?: string;
  driver: string;
  direction: 'hinfahrt' | 'rückfahrt';
  start: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  contact: string;
  passengers: { name: string, contact?: string }[];
}

export default async function CarpoolManagerSSR() {
  let initialRides: Ride[] = [];
  
  try {
    const data = await getRidesAction();
    initialRides = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Fehler beim Laden der Fahrten:', error);
    initialRides = [];
  }

  return <CarpoolClient initialRides={initialRides} />;
} 