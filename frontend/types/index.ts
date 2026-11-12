export type UserRole = 'admin' | 'operator' | 'petugas' | 'pimpinan';

export interface UserProfile {
  id: string;
  nama: string;
  username: string;
  email: string | null;
  role: UserRole;
  aktif: boolean;
  last_login_at: string | null;
  created_at: string;
}

export type CameraStatus = 'online' | 'offline' | 'nonaktif';

export interface Camera {
  id: string;
  nama: string;
  lokasi_lat: number;
  lokasi_lng: number;
  alamat: string;
  sumber_stream: string | null;
  sample_video_path: string | null;
  status: CameraStatus;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EventJenis = 'suspicious_activity' | 'crowd' | 'accident' | 'fire';
export type EventValidation = 'valid' | 'false_alarm';

export interface DetectionEvent {
  id: string;
  camera_id: string;
  camera_nama: string;
  camera_alamat: string;
  camera_lokasi_lat: number;
  camera_lokasi_lng: number;
  jenis: EventJenis;
  skor: number;
  waktu_deteksi: string;
  snapshot_path: string | null;
  clip_path: string | null;
  validasi: EventValidation | null;
  divalidasi_oleh: string | null;
  validator_nama: string | null;
  divalidasi_pada: string | null;
  has_incident: boolean;
  incident_id: string | null;
  created_at: string;
}

export type IncidentSeverity = 'rendah' | 'sedang' | 'tinggi';
export type IncidentStatus = 'baru' | 'ditugaskan' | 'diterima' | 'di_lokasi' | 'selesai' | 'ditutup';

export interface Incident {
  id: string;
  event_id: string;
  jenis: string;
  keparahan: IncidentSeverity;
  status: IncidentStatus;
  lokasi: string;
  deskripsi: string;
  dibuat_oleh: string;
  pembuat_nama: string;
  ditugaskan_ke: string | null;
  petugas_nama: string | null;
  dibuat_pada: string;
  selesai_pada: string | null;
  updated_at: string;
  camera_id?: string | null;
  camera_nama?: string | null;
  snapshot_path?: string | null;
  clip_path?: string | null;
  waktu_deteksi?: string | null;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  status_lama: string | null;
  status_baru: IncidentStatus;
  catatan: string;
  oleh: string;
  oleh_nama: string;
  oleh_role: UserRole;
  waktu: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_nama: string | null;
  username: string | null;
  user_role: string | null;
  aksi: string;
  objek_tipe: string;
  objek_id: string | null;
  ip: string | null;
  waktu: string;
  detail: Record<string, any>;
}

export interface DashboardSummary {
  total_cameras: number;
  online_cameras: number;
  offline_cameras: number;
  nonaktif_cameras: number;
  events_today: number;
  pending_events: number;
  open_incidents: number;
  avg_response_time_minutes: number;
  false_alarm_rate_percent: number;
}

export interface DistributionItem {
  name: string;
  count: number;
}

export interface DashboardIncidents {
  by_jenis: DistributionItem[];
  by_keparahan: DistributionItem[];
  by_status: DistributionItem[];
}

export interface TrendItem {
  tanggal: string;
  total_events: number;
  total_incidents: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
  };
}

