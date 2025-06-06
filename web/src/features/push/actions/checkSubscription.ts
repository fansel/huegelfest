"use server";

import { Subscriber } from '@/lib/db/models/Subscriber';
import { verifySession } from '@/features/auth/actions/userAuth';

export async function checkSubscription(endpoint?: string): Promise<{ userExists: boolean, generalExists: boolean }> {
  // Session validieren und userId extrahieren
  const sessionData = await verifySession();
  let userExists = false;
  let generalExists = false;

  if (sessionData) {
    const subscriber = await Subscriber.findOne({ userId: sessionData.userId }).exec();
    userExists = !!subscriber;
  }
  if (endpoint) {
    const generalSub = await Subscriber.findOne({ endpoint, userId: { $exists: false } }).exec();
    generalExists = !!generalSub;
  }
  return { userExists, generalExists };
} 