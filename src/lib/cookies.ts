// Cookie-Konstanten
const REACTIONS_COOKIE = 'huegelfest_reactions';
const DEVICE_ID_COOKIE = 'huegelfest_device_id';

// Cookie-Optionen
const COOKIE_OPTIONS = {
  expires: 365, // 1 Jahr in Tagen
  path: '/',
  sameSite: 'strict' as const
};

// Hilfsfunktionen für Cookies
const setCookie = (name: string, value: string, options: typeof COOKIE_OPTIONS): void => {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  
  if (options.expires) {
    const date = new Date();
    date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
    cookie += `; expires=${date.toUTCString()}`;
  }
  
  if (options.path) cookie += `; path=${options.path}`;
  if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
  
  document.cookie = cookie;
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

// Device ID Funktionen
export const getDeviceId = (): string => {
  let deviceId = getCookie(DEVICE_ID_COOKIE);
  
  if (!deviceId) {
    deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    setCookie(DEVICE_ID_COOKIE, deviceId, COOKIE_OPTIONS);
  }
  
  return deviceId;
};

// Reaktionen Funktionen
export interface DeviceReaction {
  type: string;
  announcementId: number;
}

export interface ReactionData {
  [deviceId: string]: DeviceReaction;
}

export const getDeviceReactions = (): ReactionData => {
  const reactionsJson = getCookie(REACTIONS_COOKIE);
  return reactionsJson ? JSON.parse(reactionsJson) : {};
};

export const saveDeviceReaction = (announcementId: number, reactionType: string): void => {
  const deviceId = getDeviceId();
  const reactions = getDeviceReactions();
  
  // Entferne alte Reaktionen des Geräts
  Object.keys(reactions).forEach(key => {
    if (reactions[key].announcementId === announcementId) {
      delete reactions[key];
    }
  });
  
  // Füge neue Reaktion hinzu
  reactions[deviceId] = {
    type: reactionType,
    announcementId
  };
  
  setCookie(REACTIONS_COOKIE, JSON.stringify(reactions), COOKIE_OPTIONS);
};

export const removeDeviceReaction = (announcementId: number): void => {
  const deviceId = getDeviceId();
  const reactions = getDeviceReactions();
  
  // Entferne Reaktion des Geräts
  Object.keys(reactions).forEach(key => {
    if (reactions[key].announcementId === announcementId) {
      delete reactions[key];
    }
  });
  
  setCookie(REACTIONS_COOKIE, JSON.stringify(reactions), COOKIE_OPTIONS);
}; 