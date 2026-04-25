export interface Store {
  id: string;
  name: string;
  region: string;
  city?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

export type UserRole = 'admin' | 'manager' | 'operator';

export interface Operator {
  id: string;
  name: string;
  region?: string;
  stores: Store[];
  isAdmin?: boolean;
  role?: UserRole;
  managedRegions?: string[];  // 运营经理负责的区域列表
}

export interface GPSData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GPSInfo {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  timezone: string;
  platform: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  operator: Operator | null;
  deviceInfo: DeviceInfo | null;
}

export interface PatrolImage {
  type: 'door' | 'lecheng' | 'staff' | 'counter';
  data: string;
  gps: GPSData | null;
  watermarked: boolean;
}

export interface PatrolRecord {
  id: string;
  operatorId: string;
  operatorName: string;
  storeId: string;
  storeName: string;
  date: string;
  report: string;
  images: PatrolImage[];
  gpsAnomaly: boolean;
  deviceFingerprint: string;
  createdAt: string;
}

export interface ReportSlot {
  label: string;
  timeHint: string;
  image: string | null;
  uploadTime: string | null;
}

export interface ReportRecord {
  id: string;
  operatorId: string;
  operatorName: string;
  date: string;
  slots: ReportSlot[];
  deviceFingerprint: string;
  createdAt: string;
}

export interface MeetingRecord {
  id: string;
  operatorId: string;
  operatorName: string;
  date: string;
  images: string[];
  meetingLink: string;
  summary: string;
  gpsData: GPSData | null;
  gpsAnomaly: boolean;
  deviceFingerprint: string;
  createdAt: string;
}

export interface TrainingRecord {
  id: string;
  operatorId: string;
  operatorName: string;
  date: string;
  theme: string;
  examInfo: string;
  images: string[];
  gpsData: GPSData | null;
  gpsAnomaly: boolean;
  deviceFingerprint: string;
  createdAt: string;
}

export type RecordType = 'patrol' | 'report' | 'meeting' | 'training';