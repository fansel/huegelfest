import { checkSubscription } from '@/features/push/actions/checkSubscription';
import PushNotificationSettings from './PushNotificationSettings';

interface PushNotificationSettingsServerProps {
  deviceId: string;
}

export default async function PushNotificationSettingsServer({ deviceId }: PushNotificationSettingsServerProps) {
  const { exists } = await checkSubscription(deviceId);
  return <PushNotificationSettings isSubscribed={exists} deviceId={deviceId} />;
} 