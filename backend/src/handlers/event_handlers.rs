use axum::{
    extract::{Path, Query, State},
    http::HeaderMap,
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    audit::log_audit,
    auth::AuthUser,
    config::AppConfig,
    errors::AppError,
    models::{DetectionEventWithDetails, PaginatedResponse, UserRole},
    simulator::simulate_random_event,
};

#[derive(Debug, Deserialize)]
pub struct EventQuery {
    pub validasi: Option<String>,
    pub jenis: Option<String>,
    pub camera_id: Option<Uuid>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct ValidateEventRequest {
    pub validasi: String, // 'valid' or 'false_alarm'
}

#[derive(Debug, Serialize)]
pub struct EventActionResponse {
    pub message: String,
    pub event_id: Uuid,
    pub validasi: String,
}

pub async fn list_events(
    State(pool): State<sqlx::PgPool>,
    _auth_user: AuthUser,
    Query(query): Query<EventQuery>,
) -> Result<Json<PaginatedResponse<DetectionEventWithDetails>>, AppError> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut sql = String::from(r#"
        SELECT 
            e.id, e.camera_id, c.nama as camera_nama, c.alamat as camera_alamat,
            c.lokasi_lat as camera_lokasi_lat, c.lokasi_lng as camera_lokasi_lng,
            e.jenis, e.skor::float8 as skor, e.waktu_deteksi, e.snapshot_path, e.clip_path,
            e.validasi, e.divalidasi_oleh, u.nama as validator_nama, e.divalidasi_pada,
            (i.id IS NOT NULL) as has_incident, i.id as incident_id, e.created_at
        FROM detection_events e
        JOIN cameras c ON e.camera_id = c.id
        LEFT JOIN users u ON e.divalidasi_oleh = u.id
        LEFT JOIN incidents i ON e.id = i.event_id
        WHERE 1=1
    "#);

    let mut count_sql = String::from(r#"
        SELECT COUNT(*)
        FROM detection_events e
        WHERE 1=1
    "#);

    if let Some(ref v) = query.validasi {
        match v.as_str() {
            "pending" | "menunggu" => {
                sql.push_str(" AND e.validasi IS NULL");
                count_sql.push_str(" AND e.validasi IS NULL");
            }
            "valid" => {
                sql.push_str(" AND e.validasi = 'valid'");
                count_sql.push_str(" AND e.validasi = 'valid'");
            }
            "false_alarm" => {
                sql.push_str(" AND e.validasi = 'false_alarm'");
                count_sql.push_str(" AND e.validasi = 'false_alarm'");
            }
            _ => {}
        }
    }

    if let Some(ref j) = query.jenis {
        if !j.is_empty() && j != "all" {
            let j_clean = j.trim().replace('\'', "''");
            sql.push_str(&format!(" AND e.jenis = '{}'", j_clean));
            count_sql.push_str(&format!(" AND e.jenis = '{}'", j_clean));
        }
    }

    if let Some(cam_id) = query.camera_id {
        sql.push_str(&format!(" AND e.camera_id = '{}'", cam_id));
        count_sql.push_str(&format!(" AND e.camera_id = '{}'", cam_id));
    }

    sql.push_str(&format!(" ORDER BY e.waktu_deteksi DESC LIMIT {} OFFSET {}", per_page, offset));

    let events: Vec<DetectionEventWithDetails> = sqlx::query_as(&sql).fetch_all(&pool).await?;
    let total: (i64,) = sqlx::query_as(&count_sql).fetch_one(&pool).await?;

    Ok(Json(PaginatedResponse {
        data: events,
        meta: crate::models::Meta {
            page,
            per_page,
            total: total.0,
        },
    }))
}

pub async fn get_event(
    State(pool): State<sqlx::PgPool>,
    _auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<DetectionEventWithDetails>, AppError> {
    let sql = r#"
        SELECT 
            e.id, e.camera_id, c.nama as camera_nama, c.alamat as camera_alamat,
            c.lokasi_lat as camera_lokasi_lat, c.lokasi_lng as camera_lokasi_lng,
            e.jenis, e.skor::float8 as skor, e.waktu_deteksi, e.snapshot_path, e.clip_path,
            e.validasi, e.divalidasi_oleh, u.nama as validator_nama, e.divalidasi_pada,
            (i.id IS NOT NULL) as has_incident, i.id as incident_id, e.created_at
        FROM detection_events e
        JOIN cameras c ON e.camera_id = c.id
        LEFT JOIN users u ON e.divalidasi_oleh = u.id
        LEFT JOIN incidents i ON e.id = i.event_id
        WHERE e.id = $1
    "#;

    let event = sqlx::query_as::<_, DetectionEventWithDetails>(sql)
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Event deteksi tidak ditemukan.".to_string()))?;

    Ok(Json(event))
}

pub async fn validate_event(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(payload): Json<ValidateEventRequest>,
) -> Result<Json<EventActionResponse>, AppError> {
    // Only Admin or Operator can validate events
    auth_user.require_role(&[UserRole::Admin, UserRole::Operator])?;

    let validasi = payload.validasi.trim().to_lowercase();
    if validasi != "valid" && validasi != "false_alarm" {
        return Err(AppError::Validation("Status validasi wajib bernilai 'valid' atau 'false_alarm'.".to_string()));
    }

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    // PRD RULE: Satu event hanya dapat divalidasi satu kali. Update bersyarat (optimistic lock).
    let result = sqlx::query!(
        r#"
        UPDATE detection_events
        SET validasi = $1, divalidasi_oleh = $2, divalidasi_pada = NOW()
        WHERE id = $3 AND validasi IS NULL
        "#,
        validasi,
        auth_user.id,
        id
    )
    .execute(&pool)
    .await?;

    if result.rows_affected() == 0 {
        // Cek apakah event sebenarnya ada atau sudah divalidasi sebelumnya
        let existing = sqlx::query!("SELECT validasi FROM detection_events WHERE id = $1", id)
            .fetch_optional(&pool)
            .await?;

        match existing {
            Some(row) => {
                let status_lalu = row.validasi.unwrap_or_else(|| "sudah divalidasi".to_string());
                return Err(AppError::Conflict(format!(
                    "Konflik: Event ini sudah divalidasi sebelumnya sebagai '{}' dan tidak dapat diubah kembali.",
                    status_lalu
                )));
            }
            None => {
                return Err(AppError::NotFound("Event deteksi tidak ditemukan.".to_string()));
            }
        }
    }

    log_audit(
        &pool,
        Some(auth_user.id),
        "VALIDASI_EVENT",
        "detection_event",
        Some(id),
        Some(ip),
        serde_json::json!({
            "validasi": validasi,
            "operator": auth_user.username
        }),
    )
    .await
    .ok();

    Ok(Json(EventActionResponse {
        message: format!("Event berhasil divalidasi sebagai {}.", if validasi == "valid" { "VALID" } else { "FALSE ALARM" }),
        event_id: id,
        validasi,
    }))
}

pub async fn trigger_simulation(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    auth_user.require_role(&[UserRole::Admin, UserRole::Operator])?;

    let config = AppConfig::from_env();
    match simulate_random_event(&pool, &config).await {
        Ok(Some(id)) => Ok(Json(serde_json::json!({
            "message": "Event simulasi baru berhasil dibuat.",
            "event_id": id
        }))),
        Ok(None) => Err(AppError::BadRequest("Tidak ada kamera yang berstatus online untuk simulasi event.".to_string())),
        Err(e) => Err(AppError::Internal(format!("Gagal membuat event simulasi: {}", e))),
    }
}

