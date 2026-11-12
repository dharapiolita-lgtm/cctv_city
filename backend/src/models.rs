use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    Operator,
    Petugas,
    Pimpinan,
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::Admin => write!(f, "admin"),
            UserRole::Operator => write!(f, "operator"),
            UserRole::Petugas => write!(f, "petugas"),
            UserRole::Pimpinan => write!(f, "pimpinan"),
        }
    }
}

impl std::str::FromStr for UserRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "admin" => Ok(UserRole::Admin),
            "operator" => Ok(UserRole::Operator),
            "petugas" => Ok(UserRole::Petugas),
            "pimpinan" => Ok(UserRole::Pimpinan),
            _ => Err(format!("Role tidak valid: {}", s)),
        }
    }
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub nama: String,
    pub username: String,
    pub email: Option<String>,
    pub password_hash: String,
    pub role: String,
    pub aktif: bool,
    pub failed_login_attempts: i32,
    pub locked_until: Option<DateTime<Utc>>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub nama: String,
    pub username: String,
    pub email: Option<String>,
    pub role: String,
    pub aktif: bool,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserProfile {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            nama: u.nama,
            username: u.username,
            email: u.email,
            role: u.role,
            aktif: u.aktif,
            last_login_at: u.last_login_at,
            created_at: u.created_at,
        }
    }
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Camera {
    pub id: Uuid,
    pub nama: String,
    pub lokasi_lat: f64,
    pub lokasi_lng: f64,
    pub alamat: String,
    pub sumber_stream: Option<String>,
    pub sample_video_path: Option<String>,
    pub status: String,
    pub last_seen_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct DetectionEvent {
    pub id: Uuid,
    pub camera_id: Uuid,
    pub jenis: String,
    pub skor: f64,
    pub waktu_deteksi: DateTime<Utc>,
    pub snapshot_path: Option<String>,
    pub clip_path: Option<String>,
    pub validasi: Option<String>,
    pub divalidasi_oleh: Option<Uuid>,
    pub divalidasi_pada: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct DetectionEventWithDetails {
    pub id: Uuid,
    pub camera_id: Uuid,
    pub camera_nama: String,
    pub camera_alamat: String,
    pub camera_lokasi_lat: f64,
    pub camera_lokasi_lng: f64,
    pub jenis: String,
    pub skor: f64,
    pub waktu_deteksi: DateTime<Utc>,
    pub snapshot_path: Option<String>,
    pub clip_path: Option<String>,
    pub validasi: Option<String>,
    pub divalidasi_oleh: Option<Uuid>,
    pub validator_nama: Option<String>,
    pub divalidasi_pada: Option<DateTime<Utc>>,
    pub has_incident: bool,
    pub incident_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Incident {
    pub id: Uuid,
    pub event_id: Uuid,
    pub jenis: String,
    pub keparahan: String,
    pub status: String,
    pub lokasi: String,
    pub deskripsi: String,
    pub dibuat_oleh: Uuid,
    pub ditugaskan_ke: Option<Uuid>,
    pub dibuat_pada: DateTime<Utc>,
    pub selesai_pada: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct IncidentWithDetails {
    pub id: Uuid,
    pub event_id: Uuid,
    pub jenis: String,
    pub keparahan: String,
    pub status: String,
    pub lokasi: String,
    pub deskripsi: String,
    pub dibuat_oleh: Uuid,
    pub pembuat_nama: String,
    pub ditugaskan_ke: Option<Uuid>,
    pub petugas_nama: Option<String>,
    pub dibuat_pada: DateTime<Utc>,
    pub selesai_pada: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
    pub camera_id: Option<Uuid>,
    pub camera_nama: Option<String>,
    pub snapshot_path: Option<String>,
    pub clip_path: Option<String>,
    pub waktu_deteksi: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct IncidentUpdate {
    pub id: Uuid,
    pub incident_id: Uuid,
    pub status_lama: Option<String>,
    pub status_baru: String,
    pub catatan: String,
    pub oleh: Uuid,
    pub waktu: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct IncidentUpdateWithUser {
    pub id: Uuid,
    pub incident_id: Uuid,
    pub status_lama: Option<String>,
    pub status_baru: String,
    pub catatan: String,
    pub oleh: Uuid,
    pub oleh_nama: String,
    pub oleh_role: String,
    pub waktu: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub aksi: String,
    pub objek_tipe: String,
    pub objek_id: Option<Uuid>,
    pub ip: Option<String>,
    pub waktu: DateTime<Utc>,
    pub detail: serde_json::Value,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct AuditLogWithUser {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub user_nama: Option<String>,
    pub username: Option<String>,
    pub user_role: Option<String>,
    pub aksi: String,
    pub objek_tipe: String,
    pub objek_id: Option<Uuid>,
    pub ip: Option<String>,
    pub waktu: DateTime<Utc>,
    pub detail: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Meta {
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub meta: Meta,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub data: T,
}

