'use server';

import { setSignupOpenService, getSignupOpenService } from '../services/globalStateService';
import { broadcast } from '@/lib/websocket/broadcast';

export async function setSignupOpen(open: boolean) {
  await setSignupOpenService(open);
  await broadcast('globalState', { signupOpen: open });
}

export async function getSignupOpen(): Promise<boolean> {
  return await getSignupOpenService();
} 