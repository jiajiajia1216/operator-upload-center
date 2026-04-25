import type { Operator, PatrolRecord, ReportRecord, MeetingRecord, TrainingRecord } from '../types';
import type { Store } from '../types';
import {
  apiAddPatrolRecord, apiGetPatrolRecords, apiDeletePatrolRecord,
  apiAddReportRecord, apiGetReportRecords, apiDeleteReportRecord,
  apiAddMeetingRecord, apiGetMeetingRecords, apiDeleteMeetingRecord,
  apiAddTrainingRecord, apiGetTrainingRecords, apiDeleteTrainingRecord,
} from './api';

const KEYS = {
  OPERATORS: 'oup_operators',
  OPERATORS_VERSION: 'oup_operators_version',
  CURRENT_USER: 'oup_current_user',
  PATROL: 'oup_patrol_records',
  REPORT: 'oup_report_records',
  MEETING: 'oup_meeting_records',
  TRAINING: 'oup_training_records',
  ADMIN_PASSWORD: 'oup_admin_password',
  DEVICE_BINDINGS: 'oup_device_bindings',
  DEVICE_APPROVALS: 'oup_device_approvals',
  STORES_LOADED: 'oup_stores_loaded',
} as const;

const DATA_VERSION = '20260424v4';

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ===== 远程数据加载 =====

interface RemoteOperator {
  id: string;
  name: string;
  region?: string;
  isAdmin?: boolean;
  role?: string;
  managedRegions?: string[];
}

async function fetchRemoteOperators(): Promise<RemoteOperator[]> {
  try {
    const base = import.meta.env.BASE_URL || '/';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(`${base}operators.json`, { cache: 'no-cache', signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.warn('Failed to fetch operators.json:', e);
    return [];
  }
}

async function fetchRemoteStores(): Promise<Record<string, Store[]>> {
  try {
    const base = import.meta.env.BASE_URL || '/';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(`${base}stores.json`, { cache: 'no-cache', signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.warn('Failed to fetch stores.json:', e);
    return {};
  }
}

// ===== Operators =====

export function getOperators(): Operator[] {
  return getItem<Operator[]>(KEYS.OPERATORS, []);
}

export async function initializeOperators(): Promise<string> {
  const remoteOps = await fetchRemoteOperators();
  if (remoteOps.length === 0) return DATA_VERSION;

  // Check if we need to update operators data
  const cachedVersion = getItem<string>(KEYS.OPERATORS_VERSION, '');
  const operatorsUnchanged = cachedVersion === DATA_VERSION;

  const merged: Operator[] = remoteOps.map((rop: RemoteOperator) => ({
    id: rop.id,
    name: rop.name,
    password: '',
    region: rop.region,
    isAdmin: rop.isAdmin,
    role: rop.role as Operator['role'],
    managedRegions: rop.managedRegions,
    stores: [],
  }));

  setItem(KEYS.OPERATORS, merged);
  setItem(KEYS.OPERATORS_VERSION, DATA_VERSION);

  // Always ensure stores data is loaded
  const cachedStores = getItem<string>(KEYS.STORES_LOADED, '');
  if (cachedStores !== DATA_VERSION) {
    const remoteStores = await fetchRemoteStores();
    const withStores = merged.map(op => ({
      ...op,
      stores: remoteStores[op.id] || [],
    }));
    setItem(KEYS.OPERATORS, withStores);
    setItem(KEYS.STORES_LOADED, DATA_VERSION);
  }

  return DATA_VERSION;
}

export async function loadStoresForOperators(operators: Operator[]): Promise<Operator[]> {
  const cachedVersion = getItem<string>(KEYS.STORES_LOADED, '');
  if (cachedVersion === DATA_VERSION) return operators;

  const remoteStores = await fetchRemoteStores();
  const updated = operators.map(op => ({
    ...op,
    stores: remoteStores[op.id] || [],
  }));

  setItem(KEYS.OPERATORS, updated);
  setItem(KEYS.STORES_LOADED, DATA_VERSION);
  return updated;
}

// ===== Current User =====

export function getCurrentUser(): Operator | null {
  return getItem<Operator | null>(KEYS.CURRENT_USER, null);
}

export function setCurrentUser(operator: Operator | null): void {
  if (operator) {
    setItem(KEYS.CURRENT_USER, operator);
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
}

// ===== Device Binding & Approval =====

export interface DeviceBinding {
  operatorId: string;
  operatorName: string;
  deviceId: string;
  deviceInfo: string;
  boundAt: string;
}

export interface DeviceApproval {
  id: string;
  operatorId: string;
  operatorName: string;
  deviceId: string;
  deviceInfo: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
}

export function getDeviceBindings(): DeviceBinding[] {
  return getItem<DeviceBinding[]>(KEYS.DEVICE_BINDINGS, []);
}

function saveDeviceBindings(bindings: DeviceBinding[]): void {
  setItem(KEYS.DEVICE_BINDINGS, bindings);
}

export function getDeviceApprovals(): DeviceApproval[] {
  return getItem<DeviceApproval[]>(KEYS.DEVICE_APPROVALS, []);
}

function saveDeviceApprovals(approvals: DeviceApproval[]): void {
  setItem(KEYS.DEVICE_APPROVALS, approvals);
}

export function getFriendlyDeviceInfo(userAgent: string, platform: string): string {
  const ua = userAgent;

  if (/iPhone/.test(ua)) {
    const match = ua.match(/iPhone OS (\d+[_\d]*)/);
    const version = match ? match[1].replace(/_/g, '.') : '';
    return `iPhone (iOS ${version})`;
  }
  if (/iPad/.test(ua)) {
    const match = ua.match(/iPad.*OS (\d+[_\d]*)/);
    const version = match ? match[1].replace(/_/g, '.') : '';
    return `iPad (iPadOS ${version})`;
  }
  if (/Android/.test(ua)) {
    const match = ua.match(/Android (\d+[\.\d]*)/);
    const version = match ? match[1] : '';
    const brandMap: Record<string, string> = {
      'SM-': 'Samsung Galaxy',
      'Pixel': 'Google Pixel',
      'HUAWEI': 'Huawei',
      'honor': 'Honor',
      'OPPO': 'OPPO',
      'CPH': 'OPPO',
      'vivo': 'vivo',
      'V2': 'vivo',
      'Redmi': 'Redmi',
      'Mi ': 'Xiaomi',
      'M2102': 'Xiaomi',
      'M2012': 'Xiaomi',
      'OnePlus': 'OnePlus',
      'GM19': 'OnePlus',
      'Lenovo': 'Lenovo',
    };
    let brand = '';
    for (const [prefix, name] of Object.entries(brandMap)) {
      if (ua.includes(prefix)) {
        brand = name;
        break;
      }
    }
    return brand ? `${brand} (Android ${version})` : `Android ${version}`;
  }

  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
  if (/Macintosh/.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._\d]*)/);
    const version = match ? match[1].replace(/_/g, '.') : '';
    return `macOS ${version}`;
  }
  if (/Linux/.test(ua)) return 'Linux';

  return platform || 'Unknown Device';
}

export function checkDeviceStatus(operatorId: string, deviceId: string): 'bound' | 'pending' | 'new' {
  if (isDeviceBound(operatorId, deviceId)) return 'bound';

  const approvals = getDeviceApprovals();
  const pending = approvals.find(
    (a) => a.operatorId === operatorId && a.deviceId === deviceId && a.status === 'pending'
  );
  if (pending) return 'pending';

  return 'new';
}

function isDeviceBound(operatorId: string, deviceId: string): boolean {
  const bindings = getDeviceBindings();
  return bindings.some(
    (b) => b.operatorId === operatorId && b.deviceId === deviceId
  );
}

export function bindDevice(operatorId: string, operatorName: string, deviceId: string, deviceInfo: string): void {
  const bindings = getDeviceBindings();
  const exists = bindings.some(
    (b) => b.operatorId === operatorId && b.deviceId === deviceId
  );
  if (!exists) {
    bindings.push({
      operatorId,
      operatorName,
      deviceId,
      deviceInfo,
      boundAt: new Date().toISOString(),
    });
    saveDeviceBindings(bindings);
  }
}

export function operatorHasBinding(operatorId: string): boolean {
  const bindings = getDeviceBindings();
  return bindings.some((b) => b.operatorId === operatorId);
}

export function submitDeviceApproval(operatorId: string, operatorName: string, deviceId: string, deviceInfo: string): void {
  const approvals = getDeviceApprovals();

  const existing = approvals.find(
    (a) => a.operatorId === operatorId && a.deviceId === deviceId && a.status === 'pending'
  );
  if (existing) return;

  approvals.push({
    id: `apr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    operatorId,
    operatorName,
    deviceId,
    deviceInfo,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  });
  saveDeviceApprovals(approvals);
}

export function approveDevice(approvalId: string): void {
  const approvals = getDeviceApprovals();
  const approval = approvals.find((a) => a.id === approvalId);
  if (!approval || approval.status !== 'pending') return;

  approval.status = 'approved';
  approval.reviewedAt = new Date().toISOString();
  saveDeviceApprovals(approvals);

  bindDevice(approval.operatorId, approval.operatorName, approval.deviceFingerprint, approval.deviceInfo);
}

export function rejectDevice(approvalId: string): void {
  const approvals = getDeviceApprovals();
  const approval = approvals.find((a) => a.id === approvalId);
  if (!approval || approval.status !== 'pending') return;

  approval.status = 'rejected';
  approval.reviewedAt = new Date().toISOString();
  saveDeviceApprovals(approvals);
}

export function getPendingApprovals(): DeviceApproval[] {
  return getDeviceApprovals().filter((a) => a.status === 'pending');
}

export function unbindOperatorDevices(operatorId: string): void {
  const bindings = getDeviceBindings().filter(b => b.operatorId !== operatorId);
  saveDeviceBindings(bindings);
}

export function getOperatorDevices(operatorId: string): DeviceBinding[] {
  return getDeviceBindings().filter(b => b.operatorId === operatorId);
}

// ===== Patrol Records (API + localStorage cache) =====

export function getPatrolRecords(): PatrolRecord[] {
  return getItem<PatrolRecord[]>(KEYS.PATROL, []);
}

export async function fetchPatrolRecords(operatorId?: string): Promise<PatrolRecord[]> {
  try {
    const records = await apiGetPatrolRecords(operatorId);
    setItem(KEYS.PATROL, records);
    return records;
  } catch (e) {
    console.warn('Failed to fetch patrol records from API, using cache:', e);
    return getPatrolRecords();
  }
}

export async function addPatrolRecord(record: PatrolRecord): Promise<void> {
  try {
    await apiAddPatrolRecord(record);
    // Refresh cache after successful upload
    await fetchPatrolRecords(record.operatorId);
  } catch (e) {
    console.warn('API upload failed, saving to localStorage as fallback:', e);
    const records = getPatrolRecords();
    records.unshift(record);
    setItem(KEYS.PATROL, records);
    throw e;
  }
}

export async function deletePatrolRecord(id: string, operatorId?: string): Promise<void> {
  try {
    if (operatorId) {
      await apiDeletePatrolRecord(id, operatorId);
    }
    const records = getPatrolRecords().filter((r) => r.id !== id);
    setItem(KEYS.PATROL, records);
  } catch (e) {
    console.warn('API delete failed, removing from localStorage:', e);
    const records = getPatrolRecords().filter((r) => r.id !== id);
    setItem(KEYS.PATROL, records);
    throw e;
  }
}

// ===== Report Records (API + localStorage cache) =====

export function getReportRecords(): ReportRecord[] {
  return getItem<ReportRecord[]>(KEYS.REPORT, []);
}

export async function fetchReportRecords(operatorId?: string): Promise<ReportRecord[]> {
  try {
    const records = await apiGetReportRecords(operatorId);
    setItem(KEYS.REPORT, records);
    return records;
  } catch (e) {
    console.warn('Failed to fetch report records from API, using cache:', e);
    return getReportRecords();
  }
}

export async function addReportRecord(record: ReportRecord): Promise<void> {
  try {
    await apiAddReportRecord(record);
    await fetchReportRecords(record.operatorId);
  } catch (e) {
    console.warn('API upload failed, saving to localStorage as fallback:', e);
    const records = getReportRecords();
    records.unshift(record);
    setItem(KEYS.REPORT, records);
    throw e;
  }
}

export async function deleteReportRecord(id: string, operatorId?: string): Promise<void> {
  try {
    if (operatorId) {
      await apiDeleteReportRecord(id, operatorId);
    }
    const records = getReportRecords().filter((r) => r.id !== id);
    setItem(KEYS.REPORT, records);
  } catch (e) {
    console.warn('API delete failed, removing from localStorage:', e);
    const records = getReportRecords().filter((r) => r.id !== id);
    setItem(KEYS.REPORT, records);
    throw e;
  }
}

// ===== Meeting Records (API + localStorage cache) =====

export function getMeetingRecords(): MeetingRecord[] {
  return getItem<MeetingRecord[]>(KEYS.MEETING, []);
}

export async function fetchMeetingRecords(operatorId?: string): Promise<MeetingRecord[]> {
  try {
    const records = await apiGetMeetingRecords(operatorId);
    setItem(KEYS.MEETING, records);
    return records;
  } catch (e) {
    console.warn('Failed to fetch meeting records from API, using cache:', e);
    return getMeetingRecords();
  }
}

export async function addMeetingRecord(record: MeetingRecord): Promise<void> {
  try {
    await apiAddMeetingRecord(record);
    await fetchMeetingRecords(record.operatorId);
  } catch (e) {
    console.warn('API upload failed, saving to localStorage as fallback:', e);
    const records = getMeetingRecords();
    records.unshift(record);
    setItem(KEYS.MEETING, records);
    throw e;
  }
}

export async function deleteMeetingRecord(id: string, operatorId?: string): Promise<void> {
  try {
    if (operatorId) {
      await apiDeleteMeetingRecord(id, operatorId);
    }
    const records = getMeetingRecords().filter((r) => r.id !== id);
    setItem(KEYS.MEETING, records);
  } catch (e) {
    console.warn('API delete failed, removing from localStorage:', e);
    const records = getMeetingRecords().filter((r) => r.id !== id);
    setItem(KEYS.MEETING, records);
    throw e;
  }
}

// ===== Training Records (API + localStorage cache) =====

export function getTrainingRecords(): TrainingRecord[] {
  return getItem<TrainingRecord[]>(KEYS.TRAINING, []);
}

export async function fetchTrainingRecords(operatorId?: string): Promise<TrainingRecord[]> {
  try {
    const records = await apiGetTrainingRecords(operatorId);
    setItem(KEYS.TRAINING, records);
    return records;
  } catch (e) {
    console.warn('Failed to fetch training records from API, using cache:', e);
    return getTrainingRecords();
  }
}

export async function addTrainingRecord(record: TrainingRecord): Promise<void> {
  try {
    await apiAddTrainingRecord(record);
    await fetchTrainingRecords(record.operatorId);
  } catch (e) {
    console.warn('API upload failed, saving to localStorage as fallback:', e);
    const records = getTrainingRecords();
    records.unshift(record);
    setItem(KEYS.TRAINING, records);
    throw e;
  }
}

export async function deleteTrainingRecord(id: string, operatorId?: string): Promise<void> {
  try {
    if (operatorId) {
      await apiDeleteTrainingRecord(id, operatorId);
    }
    const records = getTrainingRecords().filter((r) => r.id !== id);
    setItem(KEYS.TRAINING, records);
  } catch (e) {
    console.warn('API delete failed, removing from localStorage:', e);
    const records = getTrainingRecords().filter((r) => r.id !== id);
    setItem(KEYS.TRAINING, records);
    throw e;
  }
}