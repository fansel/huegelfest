export type NotificationSettings = {
  infoboard: boolean
  announcements: boolean
  emergency: boolean
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  unsubscribe(): Promise<void>
}

export type NotificationType = keyof NotificationSettings 