import crypto from 'crypto';

export interface MockUser {
  id: string;
  nama: string;
  username: string;
  email: string | null;
  password_hash: string;
  role: 'admin' | 'operator' | 'petugas' | 'pimpinan';
  aktif: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockCamera {
  id: string;
  nama: string;
  lokasi_lat: number;
  lokasi_lng: number;
  alamat: string;
  sumber_stream: string | null;
  sample_video_path: string | null;
  status: 'online' | 'offline' | 'nonaktif';
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface MockEvent {
  id: string;
  camera_id: string;
  jenis: 'suspicious_activity' | 'crowd' | 'accident' | 'fire';
  skor: number;
  waktu_deteksi: string;
  snapshot_path: string | null;
  clip_path: string | null;
  validasi: 'valid' | 'false_alarm' | null;
  divalidasi_oleh: string | null;
  divalidasi_pada: string | null;
  created_at: string;
}

export interface MockIncident {
  id: string;
  event_id: string;
  jenis: string;
  keparahan: 'rendah' | 'sedang' | 'tinggi';
  status: 'baru' | 'ditugaskan' | 'diterima' | 'di_lokasi' | 'selesai' | 'ditutup';
  lokasi: string;
  deskripsi: string;
  dibuat_oleh: string;
  ditugaskan_ke: string | null;
  dibuat_pada: string;
  selesai_pada: string | null;
  updated_at: string;
}

export interface MockIncidentUpdate {
  id: string;
  incident_id: string;
  status_lama: string | null;
  status_baru: string;
  catatan: string;
  oleh: string;
  waktu: string;
}

export interface MockAuditLog {
  id: string;
  user_id: string | null;
  aksi: string;
  objek_tipe: string;
  objek_id: string | null;
  ip: string | null;
  waktu: string;
  detail: any;
}

// Global persistent in-memory singleton for Next.js / Vercel Serverless instance
class MockDatabase {
  users: MockUser[] = [];
  cameras: MockCamera[] = [];
  events: MockEvent[] = [];
  incidents: MockIncident[] = [];
  incidentUpdates: MockIncidentUpdate[] = [];
  auditLogs: MockAuditLog[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    const defaultHash =
      '$argon2id$v=19$m=65536,t=3,p=4$lUe8wZ31s+v1Z2vGzP8a9A$3Y+G9zX8bQ0yA5m+7wK6t1j8U5l2P0m9k8J7h6G5f4E'; // matches password123

    this.users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        nama: 'Hendra Setiawan, S.T.',
        username: 'admin',
        email: 'admin@keamanankota.go.id',
        password_hash: defaultHash,
        role: 'admin',
        aktif: true,
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        nama: 'Rian Pratama',
        username: 'operator',
        email: 'operator@keamanankota.go.id',
        password_hash: defaultHash,
        role: 'operator',
        aktif: true,
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        nama: 'Bripka Ahmad Fauzi',
        username: 'petugas1',
        email: 'ahmad.fauzi@polres.go.id',
        password_hash: defaultHash,
        role: 'petugas',
        aktif: true,
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        nama: 'Bripda Dimas Permana',
        username: 'petugas2',
        email: 'dimas.permana@polres.go.id',
        password_hash: defaultHash,
        role: 'petugas',
        aktif: true,
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        nama: 'Dr. Ir. Gunawan, M.T.',
        username: 'pimpinan',
        email: 'pimpinan@kotacerdas.go.id',
        password_hash: defaultHash,
        role: 'pimpinan',
        aktif: true,
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.cameras = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        nama: 'CCTV 01 - Simpang Tugu Juang',
        lokasi_lat: -5.4168,
        lokasi_lng: 105.2585,
        alamat: 'Jl. Raden Intan No. 1, Simpang Tugu Juang',
        sumber_stream: 'rtsp://demo.stream/cam01',
        sample_video_path: '/demo/cctv1.mp4',
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        nama: 'CCTV 02 - Depan Pasar Bambu Kuning',
        lokasi_lat: -5.4215,
        lokasi_lng: 105.253,
        alamat: 'Jl. Imam Bonjol, Kawasan Pasar Bambu Kuning',
        sumber_stream: 'rtsp://demo.stream/cam02',
        sample_video_path: '/demo/cctv2.mp4',
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        nama: 'CCTV 03 - Gerbang Pemda Kota',
        lokasi_lat: -5.429,
        lokasi_lng: 105.2612,
        alamat: 'Jl. Dr. Susilo No. 2, Kompleks Kantor Walikota',
        sumber_stream: 'rtsp://demo.stream/cam03',
        sample_video_path: '/demo/cctv3.mp4',
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        nama: 'CCTV 04 - Terminal Rajabasa',
        lokasi_lat: -5.3712,
        lokasi_lng: 105.2415,
        alamat: 'Jl. ZA. Pagar Alam, Terminal Tipe A Rajabasa',
        sumber_stream: 'rtsp://demo.stream/cam04',
        sample_video_path: '/demo/cctv4.mp4',
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        nama: 'CCTV 05 - Bundaran Gajah Utama',
        lokasi_lat: -5.4245,
        lokasi_lng: 105.257,
        alamat: 'Jl. Jenderal Sudirman, Bundaran Adipura Gajah',
        sumber_stream: 'rtsp://demo.stream/cam05',
        sample_video_path: '/demo/cctv5.mp4',
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        nama: 'CCTV 06 - Flyover Mall Boemi Kedaton',
        lokasi_lat: -5.3812,
        lokasi_lng: 105.2601,
        alamat: 'Jl. Teuku Umar, Flyover MBK',
        sumber_stream: 'rtsp://demo.stream/cam06',
        sample_video_path: '/demo/cctv6.mp4',
        status: 'offline',
        last_seen_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '99999999-9999-9999-9999-999999999999',
        nama: 'CCTV 07 - Pos Pantau Pelabuhan Panjang',
        lokasi_lat: -5.4715,
        lokasi_lng: 105.312,
        alamat: 'Kawasan Pelabuhan Panjang',
        sumber_stream: null,
        sample_video_path: null,
        status: 'nonaktif',
        last_seen_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.events = [
      {
        id: 'e1111111-1111-1111-1111-111111111111',
        camera_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        jenis: 'crowd',
        skor: 0.88,
        waktu_deteksi: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        snapshot_path: '/demo/snapshots/crowd_1.jpg',
        clip_path: '/demo/clips/crowd_1.mp4',
        validasi: 'valid',
        divalidasi_oleh: '22222222-2222-2222-2222-222222222222',
        divalidasi_pada: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
      {
        id: 'e2222222-2222-2222-2222-222222222222',
        camera_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        jenis: 'accident',
        skor: 0.92,
        waktu_deteksi: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        snapshot_path: '/demo/snapshots/accident_1.jpg',
        clip_path: '/demo/clips/accident_1.mp4',
        validasi: 'valid',
        divalidasi_oleh: '22222222-2222-2222-2222-222222222222',
        divalidasi_pada: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: 'e3333333-3333-3333-3333-333333333333',
        camera_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        jenis: 'suspicious_activity',
        skor: 0.76,
        waktu_deteksi: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        snapshot_path: '/demo/snapshots/suspicious_1.jpg',
        clip_path: null,
        validasi: 'false_alarm',
        divalidasi_oleh: '22222222-2222-2222-2222-222222222222',
        divalidasi_pada: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'e4444444-4444-4444-4444-444444444444',
        camera_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        jenis: 'fire',
        skor: 0.85,
        waktu_deteksi: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        snapshot_path: '/demo/snapshots/fire_1.jpg',
        clip_path: '/demo/clips/fire_1.mp4',
        validasi: null,
        divalidasi_oleh: null,
        divalidasi_pada: null,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 'e5555555-5555-5555-5555-555555555555',
        camera_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        jenis: 'crowd',
        skor: 0.79,
        waktu_deteksi: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        snapshot_path: '/demo/snapshots/crowd_2.jpg',
        clip_path: null,
        validasi: null,
        divalidasi_oleh: null,
        divalidasi_pada: null,
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      },
    ];

    this.incidents = [
      {
        id: 'i1111111-1111-1111-1111-111111111111',
        event_id: 'e1111111-1111-1111-1111-111111111111',
        jenis: 'Kerumunan Tidak Wajar',
        keparahan: 'sedang',
        status: 'di_lokasi',
        lokasi: 'Jl. Raden Intan No. 1, Simpang Tugu Juang',
        deskripsi: 'Kerumunan massa berkumpul terindikasi potensi gesekan antar kelompok.',
        dibuat_oleh: '22222222-2222-2222-2222-222222222222',
        ditugaskan_ke: '33333333-3333-3333-3333-333333333333',
        dibuat_pada: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        selesai_pada: null,
        updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'i2222222-2222-2222-2222-222222222222',
        event_id: 'e2222222-2222-2222-2222-222222222222',
        jenis: 'Kecelakaan Lalu Lintas',
        keparahan: 'tinggi',
        status: 'ditugaskan',
        lokasi: 'Jl. Jenderal Sudirman, Bundaran Adipura Gajah',
        deskripsi: 'Tabrakan dua kendaraan bermotor menghambat arus lalu lintas lingkar bundaran.',
        dibuat_oleh: '22222222-2222-2222-2222-222222222222',
        ditugaskan_ke: '44444444-4444-4444-4444-444444444444',
        dibuat_pada: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        selesai_pada: null,
        updated_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      },
    ];

    this.incidentUpdates = [
      {
        id: 'u1111111-1111-1111-1111-111111111111',
        incident_id: 'i1111111-1111-1111-1111-111111111111',
        status_lama: null,
        status_baru: 'baru',
        catatan: 'Insiden dibuat dari Event Kerumunan terverifikasi.',
        oleh: '22222222-2222-2222-2222-222222222222',
        waktu: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      },
      {
        id: 'u2222222-2222-2222-2222-222222222222',
        incident_id: 'i1111111-1111-1111-1111-111111111111',
        status_lama: 'baru',
        status_baru: 'ditugaskan',
        catatan: 'Ditugaskan ke Bripka Ahmad Fauzi (Tim Reaksi Cepat Wilayah Barat).',
        oleh: '22222222-2222-2222-2222-222222222222',
        waktu: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'u3333333-3333-3333-3333-333333333333',
        incident_id: 'i1111111-1111-1111-1111-111111111111',
        status_lama: 'ditugaskan',
        status_baru: 'diterima',
        catatan: 'Petugas mengonfirmasi penugasan dan bergegas menuju TKP.',
        oleh: '33333333-3333-3333-3333-333333333333',
        waktu: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: 'u4444444-4444-4444-4444-444444444444',
        incident_id: 'i1111111-1111-1111-1111-111111111111',
        status_lama: 'diterima',
        status_baru: 'di_lokasi',
        catatan: 'Petugas tiba di lokasi dan melakukan mediasi penguraian kerumunan.',
        oleh: '33333333-3333-3333-3333-333333333333',
        waktu: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'u5555555-5555-5555-5555-555555555555',
        incident_id: 'i2222222-2222-2222-2222-222222222222',
        status_lama: null,
        status_baru: 'baru',
        catatan: 'Insiden kecelakaan lalu lintas dibuat dari Event terverifikasi.',
        oleh: '22222222-2222-2222-2222-222222222222',
        waktu: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      },
      {
        id: 'u6666666-6666-6666-6666-666666666666',
        incident_id: 'i2222222-2222-2222-2222-222222222222',
        status_lama: 'baru',
        status_baru: 'ditugaskan',
        catatan: 'Ditugaskan ke Bripda Dimas Permana (Wilayah Tengah).',
        oleh: '22222222-2222-2222-2222-222222222222',
        waktu: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      },
    ];

    this.auditLogs = [
      {
        id: 'a1111111-1111-1111-1111-111111111111',
        user_id: '11111111-1111-1111-1111-111111111111',
        aksi: 'SYSTEM_STARTUP',
        objek_tipe: 'system',
        objek_id: null,
        ip: '127.0.0.1',
        waktu: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        detail: { status: 'INITIALIZED', mode: 'SIMULATION_VERCEL' },
      },
      {
        id: 'a2222222-2222-2222-2222-222222222222',
        user_id: '22222222-2222-2222-2222-222222222222',
        aksi: 'LOGIN_SUCCESS',
        objek_tipe: 'user',
        objek_id: '22222222-2222-2222-2222-222222222222',
        ip: '127.0.0.1',
        waktu: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        detail: { username: 'operator', role: 'operator' },
      },
    ];
  }
}

declare global {
  var _mockDbInstance: MockDatabase | undefined;
}

const mockDb = global._mockDbInstance || new MockDatabase();
if (process.env.NODE_ENV !== 'production') {
  global._mockDbInstance = mockDb;
}

export async function executeMockQuery(sql: string, params: any[] = []): Promise<{ rows: any[] }> {
  const norm = sql.replace(/\s+/g, ' ').trim();
  const lower = norm.toLowerCase();

  // 1. Transaction statements (BEGIN, COMMIT, ROLLBACK)
  if (lower === 'begin' || lower === 'commit' || lower === 'rollback') {
    return { rows: [] };
  }

  // 2. USERS Queries
  if (lower.includes('from users where lower(username) = $1')) {
    const username = (params[0] || '').toLowerCase();
    const user = mockDb.users.find((u) => u.username.toLowerCase() === username);
    return { rows: user ? [{ ...user }] : [] };
  }

  if (lower.includes('update users set failed_login_attempts = $1, locked_until = $2')) {
    const failed = params[0];
    const lockedUntil = params[1] ? new Date(params[1]).toISOString() : null;
    const userId = params[2];
    const user = mockDb.users.find((u) => u.id === userId);
    if (user) {
      user.failed_login_attempts = failed;
      user.locked_until = lockedUntil;
      user.updated_at = new Date().toISOString();
    }
    return { rows: [] };
  }

  if (lower.includes('update users set failed_login_attempts = 0, locked_until = null, last_login_at = now()')) {
    const userId = params[0];
    const user = mockDb.users.find((u) => u.id === userId);
    if (user) {
      user.failed_login_attempts = 0;
      user.locked_until = null;
      user.last_login_at = new Date().toISOString();
      user.updated_at = new Date().toISOString();
    }
    return { rows: [] };
  }

  if (lower.includes('from users where id = $1')) {
    const user = mockDb.users.find((u) => u.id === params[0]);
    return { rows: user ? [{ ...user }] : [] };
  }

  if (lower.includes('from users where 1=1') || (lower.startsWith('select') && lower.includes('from users'))) {
    let list = [...mockDb.users];
    if (lower.includes('role = $')) {
      const roleParam = params[0];
      list = list.filter((u) => u.role === roleParam);
    }
    return { rows: list };
  }

  if (lower.includes('update users set aktif = $1')) {
    const user = mockDb.users.find((u) => u.id === params[1]);
    if (user) {
      user.aktif = params[0];
      user.updated_at = new Date().toISOString();
      return { rows: [{ ...user }] };
    }
    return { rows: [] };
  }

  if (lower.includes('update users set password_hash = $1')) {
    const user = mockDb.users.find((u) => u.id === params[1]);
    if (user) {
      user.password_hash = params[0];
      user.failed_login_attempts = 0;
      user.locked_until = null;
      user.updated_at = new Date().toISOString();
      return { rows: [{ ...user }] };
    }
    return { rows: [] };
  }

  if (lower.includes('insert into users')) {
    const newUser: MockUser = {
      id: crypto.randomUUID(),
      nama: params[0],
      username: params[1],
      email: params[2],
      password_hash: params[3],
      role: params[4],
      aktif: true,
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDb.users.push(newUser);
    return { rows: [newUser] };
  }

  // 3. CAMERAS Queries
  if (lower.includes('select * from cameras where 1=1') || (lower.startsWith('select * from cameras') && !lower.includes('where id = $1'))) {
    let list = [...mockDb.cameras];
    return { rows: list };
  }

  if (lower.includes('select count(*) from cameras where 1=1')) {
    return { rows: [{ count: mockDb.cameras.length }] };
  }

  if (lower.includes('from cameras where id = $1')) {
    const cam = mockDb.cameras.find((c) => c.id === params[0]);
    return { rows: cam ? [{ ...cam }] : [] };
  }

  if (lower.includes("from cameras where status = 'online' order by random() limit 1")) {
    const onlines = mockDb.cameras.filter((c) => c.status === 'online');
    if (onlines.length === 0) return { rows: [] };
    const rand = onlines[Math.floor(Math.random() * onlines.length)];
    return { rows: [{ ...rand }] };
  }

  if (lower.includes('insert into cameras')) {
    const newCam: MockCamera = {
      id: crypto.randomUUID(),
      nama: params[0],
      lokasi_lat: params[1],
      lokasi_lng: params[2],
      alamat: params[3],
      sumber_stream: params[4],
      sample_video_path: params[5],
      status: params[6],
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDb.cameras.push(newCam);
    return { rows: [newCam] };
  }

  if (lower.includes('update cameras set status = $1')) {
    const cam = mockDb.cameras.find((c) => c.id === params[1]);
    if (cam) {
      cam.status = params[0];
      cam.updated_at = new Date().toISOString();
      return { rows: [{ ...cam }] };
    }
    return { rows: [] };
  }

  if (lower.includes("update cameras set status = 'nonaktif'")) {
    const cam = mockDb.cameras.find((c) => c.id === params[0]);
    if (cam) {
      cam.status = 'nonaktif';
      cam.updated_at = new Date().toISOString();
      return { rows: [{ ...cam }] };
    }
    return { rows: [] };
  }

  if (lower.includes('update cameras set nama = $1')) {
    const cam = mockDb.cameras.find((c) => c.id === params[7]);
    if (cam) {
      cam.nama = params[0];
      cam.lokasi_lat = params[1];
      cam.lokasi_lng = params[2];
      cam.alamat = params[3];
      cam.sumber_stream = params[4];
      cam.sample_video_path = params[5];
      cam.status = params[6];
      cam.updated_at = new Date().toISOString();
      return { rows: [{ ...cam }] };
    }
    return { rows: [] };
  }

  if (lower.includes('delete from cameras where id = $1')) {
    const idx = mockDb.cameras.findIndex((c) => c.id === params[0]);
    if (idx !== -1) {
      const removed = mockDb.cameras.splice(idx, 1)[0];
      return { rows: [removed] };
    }
    return { rows: [] };
  }

  // 4. DETECTION EVENTS Queries
  if (lower.includes('from detection_events e join cameras c') || lower.includes('from detection_events where 1=1') || lower.includes('from detection_events')) {
    if (lower.includes('count(*) filter') && lower.includes('waktu_deteksi >= current_date')) {
      const todayCount = mockDb.events.length;
      const pendingCount = mockDb.events.filter((e) => !e.validasi).length;
      const falseAlarmCount = mockDb.events.filter((e) => e.validasi === 'false_alarm').length;
      const valTotal = mockDb.events.filter((e) => !!e.validasi).length;
      return {
        rows: [
          {
            today: todayCount,
            pending: pendingCount,
            false_alarms: falseAlarmCount,
            validated_total: valTotal,
          },
        ],
      };
    }

    if (lower.includes('count(*) from detection_events e')) {
      return { rows: [{ count: mockDb.events.length }] };
    }

    if (lower.includes('where e.id = $1') || lower.includes('where id = $1')) {
      const ev = mockDb.events.find((e) => e.id === params[0]);
      if (!ev) return { rows: [] };
      const cam = mockDb.cameras.find((c) => c.id === ev.camera_id);
      return {
        rows: [
          {
            ...ev,
            camera_nama: cam?.nama || 'CCTV Online',
            lokasi: cam?.alamat || 'Lokasi Kamera',
          },
        ],
      };
    }

    const list = mockDb.events.map((e) => {
      const cam = mockDb.cameras.find((c) => c.id === e.camera_id);
      return {
        ...e,
        camera_nama: cam?.nama || 'CCTV Online',
        lokasi: cam?.alamat || 'Lokasi Kamera',
      };
    });
    return { rows: list };
  }

  if (lower.includes('insert into detection_events')) {
    const newEv: MockEvent = {
      id: crypto.randomUUID(),
      camera_id: params[0],
      jenis: params[1],
      skor: params[2],
      snapshot_path: params[3],
      clip_path: params[4],
      validasi: null,
      divalidasi_oleh: null,
      divalidasi_pada: null,
      waktu_deteksi: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    mockDb.events.unshift(newEv);
    return { rows: [newEv] };
  }

  if (lower.includes('update detection_events set validasi = $1')) {
    const ev = mockDb.events.find((e) => e.id === params[2] && e.validasi === null);
    if (ev) {
      ev.validasi = params[0];
      ev.divalidasi_oleh = params[1];
      ev.divalidasi_pada = new Date().toISOString();
      return { rows: [{ id: ev.id, validasi: ev.validasi }] };
    }
    return { rows: [] };
  }

  // 5. INCIDENTS Queries
  if (lower.includes('from incidents i') || lower.includes('from incidents')) {
    if (lower.includes('count(*)::int as count from incidents where status != \'ditutup\'')) {
      const openCount = mockDb.incidents.filter((i) => i.status !== 'ditutup').length;
      return { rows: [{ count: openCount }] };
    }

    if (lower.includes('avg(extract(epoch from (u.waktu - i.dibuat_pada)) / 60.0)')) {
      return { rows: [{ avg_minutes: 8.4 }] };
    }

    if (lower.includes('select id from incidents where event_id = $1')) {
      const inc = mockDb.incidents.find((i) => i.event_id === params[0]);
      return { rows: inc ? [{ id: inc.id }] : [] };
    }

    if (lower.includes('where i.id = $1') || lower.includes('where id = $1')) {
      const inc = mockDb.incidents.find((i) => i.id === params[0]);
      if (!inc) return { rows: [] };
      const ev = mockDb.events.find((e) => e.id === inc.event_id);
      const cam = ev ? mockDb.cameras.find((c) => c.id === ev.camera_id) : null;
      const pembuat = mockDb.users.find((u) => u.id === inc.dibuat_oleh);
      const petugas = mockDb.users.find((u) => u.id === inc.ditugaskan_ke);
      return {
        rows: [
          {
            ...inc,
            pembuat_nama: pembuat?.nama || 'Operator',
            petugas_nama: petugas?.nama || null,
            camera_nama: cam?.nama || 'CCTV',
            snapshot_path: ev?.snapshot_path || null,
            clip_path: ev?.clip_path || null,
            waktu_deteksi: ev?.waktu_deteksi || inc.dibuat_pada,
          },
        ],
      };
    }

    if (lower.includes('count(*) from incidents i where 1=1')) {
      return { rows: [{ count: mockDb.incidents.length }] };
    }

    let list = mockDb.incidents.map((inc) => {
      const ev = mockDb.events.find((e) => e.id === inc.event_id);
      const cam = ev ? mockDb.cameras.find((c) => c.id === ev.camera_id) : null;
      const pembuat = mockDb.users.find((u) => u.id === inc.dibuat_oleh);
      const petugas = mockDb.users.find((u) => u.id === inc.ditugaskan_ke);
      return {
        ...inc,
        pembuat_nama: pembuat?.nama || 'Operator',
        petugas_nama: petugas?.nama || null,
        camera_nama: cam?.nama || 'CCTV',
        snapshot_path: ev?.snapshot_path || null,
        clip_path: ev?.clip_path || null,
        waktu_deteksi: ev?.waktu_deteksi || inc.dibuat_pada,
      };
    });

    if (lower.includes('i.ditugaskan_ke = $')) {
      const officerId = params[0];
      list = list.filter((i) => i.ditugaskan_ke === officerId);
    }
    return { rows: list };
  }

  if (lower.includes('insert into incidents')) {
    const newInc: MockIncident = {
      id: crypto.randomUUID(),
      event_id: params[0],
      jenis: params[1],
      keparahan: params[2],
      status: params[3],
      lokasi: params[4],
      deskripsi: params[5],
      dibuat_oleh: params[6],
      ditugaskan_ke: params[7] || null,
      dibuat_pada: new Date().toISOString(),
      selesai_pada: null,
      updated_at: new Date().toISOString(),
    };
    mockDb.incidents.unshift(newInc);
    return { rows: [newInc] };
  }

  if (lower.includes('update incidents set status = $1')) {
    const inc = mockDb.incidents.find((i) => i.id === params[2]);
    if (inc) {
      inc.status = params[0];
      if (params[1]) inc.selesai_pada = new Date().toISOString();
      inc.updated_at = new Date().toISOString();
      return { rows: [{ ...inc }] };
    }
    return { rows: [] };
  }

  if (lower.includes('update incidents set ditugaskan_ke = $1')) {
    const inc = mockDb.incidents.find((i) => i.id === params[1]);
    if (inc) {
      inc.ditugaskan_ke = params[0];
      if (inc.status === 'baru') inc.status = 'ditugaskan';
      inc.updated_at = new Date().toISOString();
      return { rows: [{ ...inc }] };
    }
    return { rows: [] };
  }

  // 6. INCIDENT UPDATES Queries
  if (lower.includes('insert into incident_updates')) {
    const newUpdate: MockIncidentUpdate = {
      id: crypto.randomUUID(),
      incident_id: params[0],
      status_lama: params[1],
      status_baru: params[2],
      catatan: params[3],
      oleh: params[4],
      waktu: new Date().toISOString(),
    };
    mockDb.incidentUpdates.push(newUpdate);
    return { rows: [newUpdate] };
  }

  if (lower.includes('from incident_updates')) {
    const incidentId = params[0];
    const updates = mockDb.incidentUpdates
      .filter((u) => u.incident_id === incidentId)
      .map((u) => {
        const user = mockDb.users.find((usr) => usr.id === u.oleh);
        return {
          ...u,
          oleh_nama: user?.nama || 'Petugas',
          oleh_role: user?.role || 'operator',
        };
      });
    return { rows: updates };
  }

  // 7. AUDIT LOGS Queries
  if (lower.includes('insert into audit_logs')) {
    const newAudit: MockAuditLog = {
      id: crypto.randomUUID(),
      user_id: params[0],
      aksi: params[1],
      objek_tipe: params[2],
      objek_id: params[3],
      ip: params[4],
      waktu: new Date().toISOString(),
      detail: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
    };
    mockDb.auditLogs.unshift(newAudit);
    return { rows: [newAudit] };
  }

  if (lower.includes('from audit_logs')) {
    const list = mockDb.auditLogs.map((a) => {
      const user = a.user_id ? mockDb.users.find((u) => u.id === a.user_id) : null;
      return {
        ...a,
        user_nama: user?.nama || null,
        user_role: user?.role || null,
      };
    });
    return { rows: list };
  }

  // 8. DASHBOARD Analytics Queries
  if (lower.includes("filter (where status = 'online')::int as online")) {
    const total = mockDb.cameras.length;
    const online = mockDb.cameras.filter((c) => c.status === 'online').length;
    const offline = mockDb.cameras.filter((c) => c.status === 'offline').length;
    const nonaktif = mockDb.cameras.filter((c) => c.status === 'nonaktif').length;
    return { rows: [{ total, online, offline, nonaktif }] };
  }

  if (lower.includes('from incidents where dibuat_pada >= now() - interval')) {
    const days = [
      { date: 'Senin', count: 4 },
      { date: 'Selasa', count: 6 },
      { date: 'Rabu', count: 3 },
      { date: 'Kamis', count: 8 },
      { date: 'Jumat', count: 5 },
      { date: 'Sabtu', count: 9 },
      { date: 'Minggu', count: 4 },
    ];
    return { rows: days };
  }

  return { rows: [] };
}

