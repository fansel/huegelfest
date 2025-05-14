import GlobalState from '@/lib/db/models/GlobalState';
import { connectDB } from '@/lib/db/connector';

export async function setSignupOpenService(open: boolean): Promise<void> {
  await connectDB();
  await GlobalState.findOneAndUpdate({}, { signupOpen: open }, { upsert: true });
}

export async function getSignupOpenService(): Promise<boolean> {
  await connectDB();
  const state = await GlobalState.findOne({});
  return state?.signupOpen ?? false;
} 