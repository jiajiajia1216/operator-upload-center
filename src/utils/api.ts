import type {
  PatrolRecord, ReportRecord, MeetingRecord, TrainingRecord,
  PatrolImage,
} from '../types';

const API_BASE = 'https://operator-upload-center-api.shujia-liang.workers.dev/api';

// ============================================================
// Generic Request Helper
// ============================================================

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  id?: string;
}

const API_TIMEOUT = 10000; // 10 seconds

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const resp = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      signal: controller.signal,
      ...options,
    });
    const json = await resp.json();
    if (!resp.ok || json.success === false) {
      throw new Error(json.error || `API Error ${resp.status}`);
    }
    // Worker returns { success: true, data: [...] } for GET list
    // Worker returns { success: true, id: "..." } for POST
    // Worker returns { success: true } for DELETE
    return json.data !== undefined ? json.data : json;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// Image Compression (Canvas -> JPEG, max 1600px, quality 0.65)
// ============================================================

function compressImageForUpload(base64: string, maxWidth = 1600, quality = 0.65): Promise<string> {
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
    img.onerror = () => reject(new Error('图片压缩失败'));
    img.src = base64;
  });
}

async function compressImageArray(images: (string | PatrolImage)[]): Promise<string[]> {
  const base64List: string[] = [];
  for (const item of images) {
    const raw = typeof item === 'string' ? item : item.data;
    const compressed = await compressImageForUpload(raw);
    base64List.push(compressed);
  }
  return base64List;
}

// ============================================================
// Patrol
// ============================================================

export async function apiAddPatrolRecord(record: PatrolRecord): Promise<void> {
  const images = await compressImageArray(record.images);
  await request('/patrol_records', {
    method: 'POST',
    body: JSON.stringify({
      id: record.id,
      operator_id: record.operatorId,
      operator_name: record.operatorName,
      store_id: record.storeId,
      store_name: record.storeName,
      date: record.date,
      report: record.report,
      images: JSON.stringify(images.map((img, i) => ({
        type: (record.images as PatrolImage[])[i]?.type || 'door',
        data: img,
      }))),
      gps_anomaly: record.gpsAnomaly ? 1 : 0,
      device_fingerprint: record.deviceFingerprint,
      created_at: record.createdAt,
    }),
  });
}

export async function apiGetPatrolRecords(operatorId?: string): Promise<PatrolRecord[]> {
  const query = operatorId ? `?operatorId=${encodeURIComponent(operatorId)}` : '';
  const rows = await request<any[]>('/patrol_records' + query);
  return rows.map(row => ({
    id: row.id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    storeId: row.store_id,
    storeName: row.store_name,
    date: row.date,
    report: row.report,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
    gpsAnomaly: !!row.gps_anomaly,
    deviceFingerprint: row.device_fingerprint,
    createdAt: row.created_at,
  }));
}

export async function apiDeletePatrolRecord(id: string, operatorId: string): Promise<void> {
  await request(`/patrol_records/${encodeURIComponent(id)}?operatorId=${encodeURIComponent(operatorId)}`, { method: 'DELETE' });
}

// ============================================================
// Report
// ============================================================

export async function apiAddReportRecord(record: ReportRecord): Promise<void> {
  const slots: { label: string; time_hint: string; image: string | null; upload_time: string | null }[] = [];
  for (const slot of record.slots) {
    let compressedImage: string | null = null;
    if (slot.image) {
      compressedImage = await compressImageForUpload(slot.image);
    }
    slots.push({
      label: slot.label,
      time_hint: slot.timeHint || '',
      image: compressedImage,
      upload_time: slot.uploadTime,
    });
  }
  await request('/report_records', {
    method: 'POST',
    body: JSON.stringify({
      id: record.id,
      operator_id: record.operatorId,
      operator_name: record.operatorName,
      date: record.date,
      slots: JSON.stringify(slots),
      device_fingerprint: record.deviceFingerprint,
      created_at: record.createdAt,
    }),
  });
}

export async function apiGetReportRecords(operatorId?: string): Promise<ReportRecord[]> {
  const query = operatorId ? `?operatorId=${encodeURIComponent(operatorId)}` : '';
  const rows = await request<any[]>('/report_records' + query);
  return rows.map(row => ({
    id: row.id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    date: row.date,
    slots: typeof row.slots === 'string' ? JSON.parse(row.slots) : row.slots,
    deviceFingerprint: row.device_fingerprint,
    createdAt: row.created_at,
  }));
}

export async function apiDeleteReportRecord(id: string, operatorId: string): Promise<void> {
  await request(`/report_records/${encodeURIComponent(id)}?operatorId=${encodeURIComponent(operatorId)}`, { method: 'DELETE' });
}

// ============================================================
// Meeting
// ============================================================

export async function apiAddMeetingRecord(record: MeetingRecord): Promise<void> {
  const images = await compressImageArray(record.images);
  await request('/meeting_records', {
    method: 'POST',
    body: JSON.stringify({
      id: record.id,
      operator_id: record.operatorId,
      operator_name: record.operatorName,
      date: record.date,
      images: JSON.stringify(images),
      meeting_link: record.meetingLink,
      summary: record.summary,
      gps_data: record.gpsData ? JSON.stringify(record.gpsData) : null,
      gps_anomaly: record.gpsAnomaly ? 1 : 0,
      device_fingerprint: record.deviceFingerprint,
      created_at: record.createdAt,
    }),
  });
}

export async function apiGetMeetingRecords(operatorId?: string): Promise<MeetingRecord[]> {
  const query = operatorId ? `?operatorId=${encodeURIComponent(operatorId)}` : '';
  const rows = await request<any[]>('/meeting_records' + query);
  return rows.map(row => ({
    id: row.id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    date: row.date,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
    meetingLink: row.meeting_link,
    summary: row.summary,
    gpsData: row.gps_data ? (typeof row.gps_data === 'string' ? JSON.parse(row.gps_data) : row.gps_data) : null,
    gpsAnomaly: !!row.gps_anomaly,
    deviceFingerprint: row.device_fingerprint,
    createdAt: row.created_at,
  }));
}

export async function apiDeleteMeetingRecord(id: string, operatorId: string): Promise<void> {
  await request(`/meeting_records/${encodeURIComponent(id)}?operatorId=${encodeURIComponent(operatorId)}`, { method: 'DELETE' });
}

// ============================================================
// Training
// ============================================================

export async function apiAddTrainingRecord(record: TrainingRecord): Promise<void> {
  const images = await compressImageArray(record.images);
  await request('/training_records', {
    method: 'POST',
    body: JSON.stringify({
      id: record.id,
      operator_id: record.operatorId,
      operator_name: record.operatorName,
      date: record.date,
      theme: record.theme,
      exam_info: record.examInfo,
      images: JSON.stringify(images),
      gps_data: record.gpsData ? JSON.stringify(record.gpsData) : null,
      gps_anomaly: record.gpsAnomaly ? 1 : 0,
      device_fingerprint: record.deviceFingerprint,
      created_at: record.createdAt,
    }),
  });
}

export async function apiGetTrainingRecords(operatorId?: string): Promise<TrainingRecord[]> {
  const query = operatorId ? `?operatorId=${encodeURIComponent(operatorId)}` : '';
  const rows = await request<any[]>('/training_records' + query);
  return rows.map(row => ({
    id: row.id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    date: row.date,
    theme: row.theme,
    examInfo: row.exam_info,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
    gpsData: row.gps_data ? (typeof row.gps_data === 'string' ? JSON.parse(row.gps_data) : row.gps_data) : null,
    gpsAnomaly: !!row.gps_anomaly,
    deviceFingerprint: row.device_fingerprint,
    createdAt: row.created_at,
  }));
}

export async function apiDeleteTrainingRecord(id: string, operatorId: string): Promise<void> {
  await request(`/training_records/${encodeURIComponent(id)}?operatorId=${encodeURIComponent(operatorId)}`, { method: 'DELETE' });
}