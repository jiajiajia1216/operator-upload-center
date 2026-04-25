import type { DeviceInfo, GPSInfo, Store } from '../types';

// ============================================================
// ID Generation
// ============================================================

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ============================================================
// Date Helpers
// ============================================================

export function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export function isSameDay(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

// ============================================================
// Device Fingerprint
// ============================================================

export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint-salt-2026', 2, 2);
  }
  const canvasData = canvas.toDataURL();
  const raw = [
    navigator.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    navigator.language,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    navigator.platform,
    canvasData.slice(-50),
  ].join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'DFP-' + Math.abs(hash).toString(36).toUpperCase();
}

export function getDeviceInfo(fingerprint: string): DeviceInfo {
  return {
    fingerprint,
    userAgent: navigator.userAgent,
    screenWidth: screen.width,
    screenHeight: screen.height,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform || 'unknown',
  };
}

// ============================================================
// GPS Location
// ============================================================

export function getCurrentGPS(): Promise<GPSInfo> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位功能，请使用手机浏览器或允许定位权限'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        });
      },
      (err) => {
        let msg = '定位失败';
        if (err.code === 1) msg = '请允许浏览器获取位置信息';
        else if (err.code === 2) msg = '无法获取位置信息，请检查网络';
        else if (err.code === 3) msg = '定位超时，请重试';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// ============================================================
// Distance Calculation (Haversine)
// ============================================================

export function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function checkGpsFence(gps: GPSInfo, store: Store, radiusKm = 5): { distance: number; isAbnormal: boolean } {
  if (!store.lat || !store.lng) return { distance: 0, isAbnormal: false };
  const distance = calcDistance(gps.lat, gps.lng, store.lat, store.lng);
  return { distance, isAbnormal: distance > radiusKm * 1000 };
}

// ============================================================
// Image Compression
// ============================================================

export function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = dataUrl;
  });
}

// ============================================================
// EXIF Detection
// ============================================================

export function extractExifOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) { resolve(-1); return; }
      const view = new DataView(buffer);
      if (view.getUint16(0, false) !== 0xffd8) { resolve(-1); return; }
      let offset = 2;
      while (offset < view.byteLength - 2) {
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker === 0xffe1) {
          const length = view.getUint16(offset, false);
          const exifStart = offset + 2;
          if (view.getUint32(exifStart, false) === 0x45786966) {
            const tiffStart = exifStart + 6;
            const isLittleEndian = view.getUint16(tiffStart, false) === 0x4949;
            const ifdOffset = view.getUint32(tiffStart + 4, isLittleEndian);
            const ifdStart = tiffStart + ifdOffset;
            const numEntries = view.getUint16(ifdStart, isLittleEndian);
            for (let i = 0; i < numEntries; i++) {
              const entryOffset = ifdStart + 2 + i * 12;
              if (view.getUint16(entryOffset, isLittleEndian) === 0x0112) {
                resolve(view.getUint16(entryOffset + 8, isLittleEndian));
                return;
              }
            }
          }
          offset += length - 2;
        } else if ((marker & 0xff00) === 0xff00) {
          offset += view.getUint16(offset, false);
        } else {
          break;
        }
      }
      resolve(-1);
    };
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

// ============================================================
// Watermark Generation
// ============================================================

interface WatermarkOptions {
  text: string;
  operatorName: string;
  storeName: string;
  gps?: GPSInfo;
  label?: string;
}

export function addWatermarkToImage(base64Image: string, options: WatermarkOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      const MAX = 1920;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        const scale = MAX / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const barHeight = Math.max(80, h * 0.1);
      const barY = h - barHeight;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, barY, w, barHeight);

      const fontSize = Math.max(12, Math.min(16, w * 0.025));
      ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';

      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const line1 = `${options.operatorName} | ${options.storeName}`;
      const line2 = timeStr;
      const line3 = options.gps
        ? `GPS: ${options.gps.lat.toFixed(4)}, ${options.gps.lng.toFixed(4)}`
        : '';

      const x = 12;
      const lineHeight = fontSize + 6;
      let y = barY + lineHeight;

      ctx.fillText(line1, x, y);
      y += lineHeight;
      ctx.fillText(line2, x, y);
      y += lineHeight;
      if (line3) ctx.fillText(line3, x, y);

      if (options.label) {
        const lblSize = Math.max(14, fontSize + 2);
        ctx.font = `bold ${lblSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const lbl = options.label;
        const lblW = ctx.measureText(lbl).width + 16;
        const lblH = lblSize + 12;
        const lblX = w - lblW - 8;
        const lblY = 8;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        roundRect(ctx, lblX, lblY, lblW, lblH, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(lbl, lblX + 8, lblY + lblH / 2);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = base64Image;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function addReportWatermark(base64Image: string, operatorName: string): Promise<string> {
  return addWatermarkToImage(base64Image, {
    text: '数据通报',
    operatorName,
    storeName: '',
    label: undefined,
  });
}

// ============================================================
// Time Validation
// ============================================================

export type ReportRecordTimeSlot = 'morning_monthly' | 'afternoon_14' | 'afternoon_17' | 'afternoon_20';

export function getCurrentTimeSlot(): ReportRecordTimeSlot | null {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning_monthly';
  if (hour >= 13 && hour < 15) return 'afternoon_14';
  if (hour >= 16 && hour < 18) return 'afternoon_17';
  if (hour >= 19 && hour < 22) return 'afternoon_20';
  return null;
}

export function getTimeSlotLabel(slot: ReportRecordTimeSlot): string {
  const map: Record<ReportRecordTimeSlot, string> = {
    morning_monthly: '上午通报（月度累计数据）',
    afternoon_14: '下午通报 14:00（实时数据）',
    afternoon_17: '下午通报 17:00（实时数据）',
    afternoon_20: '下午通报 20:00（实时数据）',
  };
  return map[slot];
}

export function getTimeSlotShortLabel(slot: ReportRecordTimeSlot): string {
  const map: Record<ReportRecordTimeSlot, string> = {
    morning_monthly: '上午',
    afternoon_14: '14:00',
    afternoon_17: '17:00',
    afternoon_20: '20:00',
  };
  return map[slot];
}

// ============================================================
// Distance Formatting
// ============================================================

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// ============================================================
// Record Lock Check (次日自动锁定)
// ============================================================

export function isRecordLocked(createdAt: string): boolean {
  const created = new Date(createdAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  created.setHours(0, 0, 0, 0);
  return created.getTime() < today.getTime();
}

// ============================================================
// Monthly Count Helper
// ============================================================

export function getMonthKey(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}