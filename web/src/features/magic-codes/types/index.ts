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
}

export interface ActiveMagicCode {
  id: string;
  code: string;
  userName: string;
  deviceId: string;
  expiresAt: Date;
  createdBy: 'user' | 'admin';
  adminId?: string;
  createdAt: Date;
}

export type TransferStep = 'initial' | 'generate' | 'input' | 'success';

export interface GeneratedCode {
  code: string;
  expiresAt: Date;
} 