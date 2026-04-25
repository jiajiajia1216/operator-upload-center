export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  language: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  timezone: string;
  canvasHash: string;
  createdAt: string;
}

export interface LoginRecord {
  operatorId: string;
  operatorName: string;
  deviceFingerprint: string;
  timestamp: string;
  flagged: boolean;
  flagReason?: string;
}

export interface GPSData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

let cachedFingerprint: string | null = null;

function getCanvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('DeviceFP,2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('DeviceFP,2026', 4, 17);
    const data = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  } catch {
    return 'canvas-error';
  }
}

export function generateFingerprint(): DeviceFingerprint {
  if (cachedFingerprint) {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    return {
      id: cachedFingerprint,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: nav.userAgentData?.platform || navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvasHash: getCanvasHash(),
      createdAt: new Date().toISOString(),
    };
  }

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const components = [
    navigator.userAgent,
    navigator.language,
    nav.userAgentData?.platform || navigator.platform,
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    getCanvasHash(),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  cachedFingerprint = Math.abs(hash).toString(36);

  return {
    id: cachedFingerprint,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: nav.userAgentData?.platform || navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvasHash: getCanvasHash(),
    createdAt: new Date().toISOString(),
  };
}

// ============================================================
// GPS Position
// ============================================================

export function getGPSPosition(): Promise<GPSData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
      },
      () => {
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

// ============================================================
// Login Record Management
// ============================================================

const LOGIN_RECORDS_KEY = 'oup_login_records';
const ANOMALY_THRESHOLD_DEVICES = 3;
const ANOMALY_THRESHOLD_DAYS = 30;

function getLoginRecordsFromStorage(): LoginRecord[] {
  try {
    const raw = localStorage.getItem(LOGIN_RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLoginRecordsToStorage(records: LoginRecord[]): void {
  localStorage.setItem(LOGIN_RECORDS_KEY, JSON.stringify(records));
}

export function getLoginRecords(): LoginRecord[] {
  return getLoginRecordsFromStorage();
}

export function addLoginRecord(record: LoginRecord): void {
  const records = getLoginRecordsFromStorage();
  records.unshift(record);
  // Keep last 200 records
  if (records.length > 200) {
    records.length = 200;
  }
  saveLoginRecordsToStorage(records);
}

export function checkDeviceAnomaly(operatorId: string): {
  isAnomaly: boolean;
  reason: string;
  deviceCount: number;
} {
  const records = getLoginRecordsFromStorage();
  const now = Date.now();
  const cutoff = now - ANOMALY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  const recentRecords = records.filter(
    (r) => r.operatorId === operatorId && new Date(r.timestamp).getTime() > cutoff
  );

  if (recentRecords.length === 0) {
    return { isAnomaly: false, reason: '', deviceCount: 0 };
  }

  const uniqueDevices = new Set(recentRecords.map((r) => r.deviceFingerprint));

  if (uniqueDevices.size >= ANOMALY_THRESHOLD_DEVICES) {
    return {
      isAnomaly: true,
      reason: `近${ANOMALY_THRESHOLD_DAYS}天内使用了${uniqueDevices.size}种不同设备登录（阈值：${ANOMALY_THRESHOLD_DEVICES}）`,
      deviceCount: uniqueDevices.size,
    };
  }

  return { isAnomaly: false, reason: '', deviceCount: uniqueDevices.size };
}

export function clearLoginRecords(): void {
  localStorage.removeItem(LOGIN_RECORDS_KEY);
}