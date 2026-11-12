use axum::{
    extract::{Path, Query, State},
    http::HeaderMap,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    audit::log_audit,
    auth::AuthUser,
    errors::AppError,
    models::{Camera, PaginatedResponse, UserRole},
};

#[derive(Debug, Deserialize)]
pub struct CameraQuery {
    pub status: Option<String>,
    pub q: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCameraRequest {
    pub nama: String,
    pub lokasi_lat: f64,
    pub lokasi_lng: f64,
    pub alamat: String,
    pub sumber_stream: Option<String>,
    pub sample_video_path: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCameraRequest {
    pub nama: Option<String>,
    pub lokasi_lat: Option<f64>,
    pub lokasi_lng: Option<f64>,
    pub alamat: Option<String>,
    pub sumber_stream: Option<String>,
    pub sample_video_path: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCameraStatusRequest {
    pub status: String,
}

pub async fn list_cameras(
    State(pool): State<sqlx::PgPool>,
    _auth_user: AuthUser,
    Query(query): Query<CameraQuery>,
) -> Result<Json<PaginatedResponse<Camera>>, AppError> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut sql = String::from("SELECT id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at FROM cameras WHERE 1=1");
    let mut count_sql = String::from("SELECT COUNT(*) FROM cameras WHERE 1=1");

    if let Some(ref st) = query.status {
        if !st.is_empty() && st != "all" {
            sql.push_str(&format!(" AND status = '{}'", st.replace('\'', "''")));
            count_sql.push_str(&format!(" AND status = '{}'", st.replace('\'', "''")));
        }
    }

    if let Some(ref q) = query.q {
        let q_clean = q.trim().replace('\'', "''");
        if !q_clean.is_empty() {
            sql.push_str(&format!(" AND (nama ILIKE '%{}%' OR alamat ILIKE '%{}%')", q_clean, q_clean));
            count_sql.push_str(&format!(" AND (nama ILIKE '%{}%' OR alamat ILIKE '%{}%')", q_clean, q_clean));
        }
    }

    sql.push_str(&format!(" ORDER BY nama ASC LIMIT {} OFFSET {}", per_page, offset));

    let cameras: Vec<Camera> = sqlx::query_as(&sql).fetch_all(&pool).await?;
    let total: (i64,) = sqlx::query_as(&count_sql).fetch_one(&pool).await?;

    Ok(Json(PaginatedResponse {
        data: cameras,
        meta: crate::models::Meta {
            page,
            per_page,
            total: total.0,
        },
    }))
}

pub async fn get_camera(
    State(pool): State<sqlx::PgPool>,
    _auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Camera>, AppError> {
    let camera = sqlx::query_as!(
        Camera,
        r#"
        SELECT id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at
        FROM cameras
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Kamera tidak ditemukan.".to_string()))?;

    Ok(Json(camera))
}

pub async fn create_camera(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    headers: HeaderMap,
    Json(payload): Json<CreateCameraRequest>,
) -> Result<Json<Camera>, AppError> {
    auth_user.require_role(&[UserRole::Admin])?;

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    if payload.nama.trim().is_empty() || payload.alamat.trim().is_empty() {
        return Err(AppError::Validation("Nama kamera dan alamat lokasi wajib diisi.".to_string()));
    }

    let status = payload.status.unwrap_or_else(|| "online".to_string());
    if !["online", "offline", "nonaktif"].contains(&status.as_str()) {
        return Err(AppError::Validation("Status kamera harus online, offline, atau nonaktif.".to_string()));
    }

    let id = Uuid::new_v4();
    let camera = sqlx::query_as!(
        Camera,
        r#"
        INSERT INTO cameras (id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
        RETURNING id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at
        "#,
        id,
        payload.nama.trim(),
        payload.lokasi_lat,
        payload.lokasi_lng,
        payload.alamat.trim(),
        payload.sumber_stream,
        payload.sample_video_path,
        status
    )
    .fetch_one(&pool)
    .await?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "CREATE_CAMERA",
        "camera",
        Some(camera.id),
        Some(ip),
        serde_json::json!({
            "nama": camera.nama,
            "status": camera.status,
            "alamat": camera.alamat
        }),
    )
    .await
    .ok();

    Ok(Json(camera))
}

pub async fn update_camera(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(payload): Json<UpdateCameraRequest>,
) -> Result<Json<Camera>, AppError> {
    auth_user.require_role(&[UserRole::Admin])?;

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    let existing = sqlx::query_as!(
        Camera,
        "SELECT id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at FROM cameras WHERE id = $1",
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Kamera tidak ditemukan.".to_string()))?;

    let nama = payload.nama.unwrap_or(existing.nama);
    let lokasi_lat = payload.lokasi_lat.unwrap_or(existing.lokasi_lat);
    let lokasi_lng = payload.lokasi_lng.unwrap_or(existing.lokasi_lng);
    let alamat = payload.alamat.unwrap_or(existing.alamat);
    let sumber_stream = payload.sumber_stream.or(existing.sumber_stream);
    let sample_video_path = payload.sample_video_path.or(existing.sample_video_path);
    let status = payload.status.unwrap_or(existing.status);

    if !["online", "offline", "nonaktif"].contains(&status.as_str()) {
        return Err(AppError::Validation("Status kamera harus online, offline, atau nonaktif.".to_string()));
    }

    let updated = sqlx::query_as!(
        Camera,
        r#"
        UPDATE cameras
        SET nama = $1, lokasi_lat = $2, lokasi_lng = $3, alamat = $4, sumber_stream = $5, sample_video_path = $6, status = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at
        "#,
        nama,
        lokasi_lat,
        lokasi_lng,
        alamat,
        sumber_stream,
        sample_video_path,
        status,
        id
    )
    .fetch_one(&pool)
    .await?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "UPDATE_CAMERA",
        "camera",
        Some(id),
        Some(ip),
        serde_json::json!({
            "nama": updated.nama,
            "status": updated.status
        }),
    )
    .await
    .ok();

    Ok(Json(updated))
}

pub async fn deactivate_camera(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> Result<Json<Camera>, AppError> {
    auth_user.require_role(&[UserRole::Admin])?;

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    let updated = sqlx::query_as!(
        Camera,
        r#"
        UPDATE cameras
        SET status = 'nonaktif', updated_at = NOW()
        WHERE id = $1
        RETURNING id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at
        "#,
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Kamera tidak ditemukan.".to_string()))?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "DEACTIVATE_CAMERA",
        "camera",
        Some(id),
        Some(ip),
        serde_json::json!({"nama": updated.nama, "status": "nonaktif"}),
    )
    .await
    .ok();

    Ok(Json(updated))
}

pub async fn update_camera_status(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(payload): Json<UpdateCameraStatusRequest>,
) -> Result<Json<Camera>, AppError> {
    auth_user.require_role(&[UserRole::Admin, UserRole::Operator])?;

    if !["online", "offline", "nonaktif"].contains(&payload.status.as_str()) {
        return Err(AppError::Validation("Status kamera tidak valid.".to_string()));
    }

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    let updated = sqlx::query_as!(
        Camera,
        r#"
        UPDATE cameras
        SET status = $1, last_seen_at = CASE WHEN $1 = 'online' THEN NOW() ELSE last_seen_at END, updated_at = NOW()
        WHERE id = $2
        RETURNING id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at
        "#,
        payload.status,
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Kamera tidak ditemukan.".to_string()))?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "UPDATE_CAMERA_STATUS",
        "camera",
        Some(id),
        Some(ip),
        serde_json::json!({"status": updated.status}),
    )
    .await
    .ok();

    Ok(Json(updated))
}

