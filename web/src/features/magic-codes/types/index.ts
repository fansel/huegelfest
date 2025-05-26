export interface MagicCodeData {
  id: string;
  code: string;
  deviceId: string;
  userId: string;
  userName: string;
  expiresAt: Date;
  isUsed: boolean;
  createdBy: 'user' | 'admin';
  adminId?: string;
  createdAt: Date;
}

export interface CreateMagicCodeRequest {
  deviceId: string;
  createdBy?: 'user' | 'admin';
  adminId?: string;
}

export interface TransferDeviceRequest {
  code: string;
  newDeviceId: string;
}

export interface MagicCodeResult {
  success: boolean;
  code?: string;
  expiresAt?: Date;
  error?: string;
}

export interface DeviceTransferResult {
  success: boolean;
  userId?: string;
  userName?: string;
  error?: string;
  pushSubscriptionInfo?: {
    hadPushSubscription: boolean;
    requiresReactivation: boolean;
    message?: string;
  };
  transferredDeviceId?: string;
  newFreshDeviceId?: string;
}

/**
 * ActiveMagicCode as returned from server actions (dates as strings)
 */
export interface ActiveMagicCode {
  id: string;
  code: string;
  userName: string;
  deviceId: string;
  expiresAt: string; // String from server action
  createdBy: 'user' | 'admin';
  adminId?: string;
  createdAt: string; // String from server action
}

/**
 * ActiveMagicCode with parsed dates for client use
 */
export interface ParsedActiveMagicCode {
  id: string;
  code: string;
  userName: string;
  deviceId: string;
  expiresAt: Date; // Parsed Date object
  createdBy: 'user' | 'admin';
  adminId?: string;
  createdAt: Date; // Parsed Date object
}

export type TransferStep = 'initial' | 'generate' | 'input' | 'success';

export interface GeneratedCode {
  code: string;
  expiresAt: Date;
} 