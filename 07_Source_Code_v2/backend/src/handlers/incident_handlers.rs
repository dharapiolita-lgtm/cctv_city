use axum::{
    extract::{Path, Query, State},
    http::HeaderMap,
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    audit::log_audit,
    auth::AuthUser,
    errors::AppError,
    models::{
        Incident, IncidentUpdateWithUser, IncidentWithDetails, PaginatedResponse, User, UserRole,
    },
};

#[derive(Debug, Deserialize)]
pub struct IncidentQuery {
    pub status: Option<String>,
    pub keparahan: Option<String>,
    pub petugas_id: Option<Uuid>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateIncidentRequest {
    pub event_id: Uuid,
    pub jenis: String,
    pub keparahan: String, // 'rendah', 'sedang', 'tinggi'
    pub lokasi: String,
    pub deskripsi: String,
    pub ditugaskan_ke: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct AssignIncidentRequest {
    pub ditugaskan_ke: Uuid,
    pub catatan: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateIncidentStatusRequest {
    pub status: String,
    pub catatan: String,
}

#[derive(Debug, Deserialize)]
pub struct AddIncidentNoteRequest {
    pub catatan: String,
}

#[derive(Debug, Serialize)]
pub struct IncidentDetailResponse {
    pub incident: IncidentWithDetails,
    pub updates: Vec<IncidentUpdateWithUser>,
}

pub async fn list_incidents(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Query(query): Query<IncidentQuery>,
) -> Result<Json<PaginatedResponse<IncidentWithDetails>>, AppError> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut sql = String::from(r#"
        SELECT 
            i.id, i.event_id, i.jenis, i.keparahan, i.status, i.lokasi, i.deskripsi,
            i.dibuat_oleh, u1.nama as pembuat_nama,
            i.ditugaskan_ke, u2.nama as petugas_nama,
            i.dibuat_pada, i.selesai_pada, i.updated_at,
            e.camera_id, c.nama as camera_nama, e.snapshot_path, e.clip_path, e.waktu_deteksi
        FROM incidents i
        JOIN users u1 ON i.dibuat_oleh = u1.id
        LEFT JOIN users u2 ON i.ditugaskan_ke = u2.id
        JOIN detection_events e ON i.event_id = e.id
        JOIN cameras c ON e.camera_id = c.id
        WHERE 1=1
    "#);

    let mut count_sql = String::from(r#"
        SELECT COUNT(*)
        FROM incidents i
        WHERE 1=1
    "#);

    // PRD RULE: Petugas hanya dapat melihat insiden yang ditugaskan kepadanya
    if auth_user.role == UserRole::Petugas {
        sql.push_str(&format!(" AND i.ditugaskan_ke = '{}'", auth_user.id));
        count_sql.push_str(&format!(" AND i.ditugaskan_ke = '{}'", auth_user.id));
    } else if let Some(petugas_id) = query.petugas_id {
        sql.push_str(&format!(" AND i.ditugaskan_ke = '{}'", petugas_id));
        count_sql.push_str(&format!(" AND i.ditugaskan_ke = '{}'", petugas_id));
    }

    if let Some(ref st) = query.status {
        if !st.is_empty() && st != "all" {
            let st_clean = st.trim().replace('\'', "''");
            sql.push_str(&format!(" AND i.status = '{}'", st_clean));
            count_sql.push_str(&format!(" AND i.status = '{}'", st_clean));
        }
    }

    if let Some(ref kp) = query.keparahan {
        if !kp.is_empty() && kp != "all" {
            let kp_clean = kp.trim().replace('\'', "''");
            sql.push_str(&format!(" AND i.keparahan = '{}'", kp_clean));
            count_sql.push_str(&format!(" AND i.keparahan = '{}'", kp_clean));
        }
    }

    sql.push_str(&format!(" ORDER BY i.dibuat_pada DESC LIMIT {} OFFSET {}", per_page, offset));

    let incidents: Vec<IncidentWithDetails> = sqlx::query_as(&sql).fetch_all(&pool).await?;
    let total: (i64,) = sqlx::query_as(&count_sql).fetch_one(&pool).await?;

    Ok(Json(PaginatedResponse {
        data: incidents,
        meta: crate::models::Meta {
            page,
            per_page,
            total: total.0,
        },
    }))
}

pub async fn get_incident(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<IncidentDetailResponse>, AppError> {
    let sql = r#"
        SELECT 
            i.id, i.event_id, i.jenis, i.keparahan, i.status, i.lokasi, i.deskripsi,
            i.dibuat_oleh, u1.nama as pembuat_nama,
            i.ditugaskan_ke, u2.nama as petugas_nama,
            i.dibuat_pada, i.selesai_pada, i.updated_at,
            e.camera_id, c.nama as camera_nama, e.snapshot_path, e.clip_path, e.waktu_deteksi
        FROM incidents i
        JOIN users u1 ON i.dibuat_oleh = u1.id
        LEFT JOIN users u2 ON i.ditugaskan_ke = u2.id
        JOIN detection_events e ON i.event_id = e.id
        JOIN cameras c ON e.camera_id = c.id
        WHERE i.id = $1
    "#;

    let incident = sqlx::query_as::<_, IncidentWithDetails>(sql)
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Insiden tidak ditemukan.".to_string()))?;

    // PRD RULE: Petugas hanya dapat mengakses insiden yang ditugaskan kepadanya
    if auth_user.role == UserRole::Petugas && incident.ditugaskan_ke != Some(auth_user.id) {
        return Err(AppError::Forbidden("Anda tidak memiliki akses ke insiden ini.".to_string()));
    }

    // Ambil timeline perubahan status
    let updates_sql = r#"
        SELECT 
            u.id, u.incident_id, u.status_lama, u.status_baru, u.catatan,
            u.oleh, usr.nama as oleh_nama, usr.role as oleh_role, u.waktu
        FROM incident_updates u
        JOIN users usr ON u.oleh = usr.id
        WHERE u.incident_id = $1
        ORDER BY u.waktu ASC
    "#;

    let updates: Vec<IncidentUpdateWithUser> = sqlx::query_as(updates_sql)
        .bind(id)
        .fetch_all(&pool)
        .await?;

    Ok(Json(IncidentDetailResponse { incident, updates }))
}

pub async fn create_incident(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    headers: HeaderMap,
    Json(payload): Json<CreateIncidentRequest>,
) -> Result<Json<Incident>, AppError> {
    // Only Admin or Operator can create incidents
    auth_user.require_role(&[UserRole::Admin, UserRole::Operator])?;

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    // 1. Validasi Event
    let event = sqlx::query!(
        "SELECT id, validasi FROM detection_events WHERE id = $1",
        payload.event_id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Event deteksi sumber tidak ditemukan.".to_string()))?;

    match event.validasi.as_deref() {
        Some("valid") => {}
        Some("false_alarm") => {
            return Err(AppError::BadRequest("Event false alarm tidak dapat dikonversi menjadi insiden.".to_string()));
        }
        _ => {
            return Err(AppError::BadRequest("Event harus divalidasi terlebih dahulu sebagai VALID sebelum dibuatkan insiden.".to_string()));
        }
    }

    // 2. PRD RULE: Satu event hanya dapat menghasilkan satu insiden
    let existing_incident = sqlx::query!("SELECT id FROM incidents WHERE event_id = $1", payload.event_id)
        .fetch_optional(&pool)
        .await?;

    if existing_incident.is_some() {
        return Err(AppError::Conflict("Event ini sudah memiliki insiden yang aktif.".to_string()));
    }

    // Validasi keparahan
    let keparahan = payload.keparahan.to_lowercase();
    if !["rendah", "sedang", "tinggi"].contains(&keparahan.as_str()) {
        return Err(AppError::Validation("Tingkat keparahan harus 'rendah', 'sedang', atau 'tinggi'.".to_string()));
    }

    // Validasi petugas jika diisi
    if let Some(petugas_id) = payload.ditugaskan_ke {
        let pet = sqlx::query!("SELECT id, role FROM users WHERE id = $1 AND aktif = true", petugas_id)
            .fetch_optional(&pool)
            .await?
            .ok_or_else(|| AppError::NotFound("Petugas yang dipilih tidak ditemukan atau nonaktif.".to_string()))?;

        if pet.role != "petugas" && pet.role != "operator" && pet.role != "admin" {
            return Err(AppError::Validation("Penugasan hanya dapat diberikan kepada akun petugas.".to_string()));
        }
    }

    let initial_status = if payload.ditugaskan_ke.is_some() { "ditugaskan" } else { "baru" };
    let incident_id = Uuid::new_v4();

    // 3. ATOMIC TRANSACTION
    let mut tx = pool.begin().await?;

    let incident = sqlx::query_as!(
        Incident,
        r#"
        INSERT INTO incidents (id, event_id, jenis, keparahan, status, lokasi, deskripsi, dibuat_oleh, ditugaskan_ke, dibuat_pada, selesai_pada, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NULL, NOW())
        RETURNING id, event_id, jenis, keparahan, status, lokasi, deskripsi, dibuat_oleh, ditugaskan_ke, dibuat_pada, selesai_pada, updated_at
        "#,
        incident_id,
        payload.event_id,
        payload.jenis.trim(),
        keparahan,
        initial_status,
        payload.lokasi.trim(),
        payload.deskripsi.trim(),
        auth_user.id,
        payload.ditugaskan_ke
    )
    .fetch_one(&mut *tx)
    .await?;

    // Initial update in timeline
    let update_catatan = if payload.ditugaskan_ke.is_some() {
        "Insiden dibuat dari Event deteksi terverifikasi dan langsung ditugaskan ke petugas lapangan."
    } else {
        "Insiden dibuat dari Event deteksi terverifikasi."
    };

    sqlx::query!(
        r#"
        INSERT INTO incident_updates (id, incident_id, status_lama, status_baru, catatan, oleh, waktu)
        VALUES (gen_random_uuid(), $1, NULL, $2, $3, $4, NOW())
        "#,
        incident.id,
        initial_status,
        update_catatan,
        auth_user.id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "CREATE_INCIDENT",
        "incident",
        Some(incident.id),
        Some(ip),
        serde_json::json!({
            "jenis": incident.jenis,
            "keparahan": incident.keparahan,
            "status": incident.status,
            "event_id": incident.event_id
        }),
    )
    .await
    .ok();

    Ok(Json(incident))
}

pub async fn assign_incident(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(payload): Json<AssignIncidentRequest>,
) -> Result<Json<Incident>, AppError> {
    auth_user.require_role(&[UserRole::Admin, UserRole::Operator])?;

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    // Pastikan user tujuan ada dan aktif
    let target_user = sqlx::query!("SELECT id, nama, role FROM users WHERE id = $1 AND aktif = true", payload.ditugaskan_ke)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Petugas yang dipilih tidak ditemukan atau nonaktif.".to_string()))?;

    let incident = sqlx::query_as!(
        Incident,
        "SELECT id, event_id, jenis, keparahan, status, lokasi, deskripsi, dibuat_oleh, ditugaskan_ke, dibuat_pada, selesai_pada, updated_at FROM incidents WHERE id = $1",
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Insiden tidak ditemukan.".to_string()))?;

    if incident.status == "ditutup" {
        return Err(AppError::BadRequest("Insiden yang telah ditutup tidak dapat ditugaskan ulang.".to_string()));
    }

    let mut tx = pool.begin().await?;

    let updated = sqlx::query_as!(
        Incident,
        r#"
        UPDATE incidents
        SET ditugaskan_ke = $1, status = 'ditugaskan', updated_at = NOW()
        WHERE id = $2
        RETURNING id, event_id, jenis, keparahan, status, lokasi, deskripsi, dibuat_oleh, ditugaskan_ke, dibuat_pada, selesai_pada, updated_at
        "#,
        payload.ditugaskan_ke,
        id
    )
    .fetch_one(&mut *tx)
    .await?;

    let catatan_text = payload.catatan.unwrap_or_else(|| {
        format!("Penugasan insiden kepada petugas: {}.", target_user.nama)
    });

    sqlx::query!(
        r#"
        INSERT INTO incident_updates (id, incident_id, status_lama, status_baru, catatan, oleh, waktu)
        VALUES (gen_random_uuid(), $1, $2, 'ditugaskan', $3, $4, NOW())
        "#,
        id,
        incident.status,
        catatan_text,
        auth_user.id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "ASSIGN_INCIDENT",
        "incident",
        Some(id),
        Some(ip),
        serde_json::json!({
            "ditugaskan_ke": payload.ditugaskan_ke,
            "petugas_nama": target_user.nama
        }),
    )
    .await
    .ok();

    Ok(Json(updated))
}

pub async fn update_incident_status(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(payload): Json<UpdateIncidentStatusRequest>,
) -> Result<Json<Incident>, AppError> {
    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    let incident = sqlx::query_as!(
        Incident,
        "SELECT id, event_id, jenis, keparahan, status, lokasi, deskripsi, dibuat_oleh, ditugaskan_ke, dibuat_pada, selesai_pada, updated_at FROM incidents WHERE id = $1",
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Insiden tidak ditemukan.".to_string()))?;

    let status_lama = incident.status.as_str();
    let status_baru = payload.status.trim().to_lowercase();
    let catatan = payload.catatan.trim();

    if catatan.is_empty() {
        return Err(AppError::Validation("Catatan pembaruan status wajib diisi.".to_string()));
    }

    // WORKFLOW VALIDATION: baru -> ditugaskan -> diterima -> di_lokasi -> selesai -> ditutup
    let valid_transition = match (status_lama, status_baru.as_str()) {
        ("baru", "ditugaskan") => true,
        ("ditugaskan", "diterima") => true,
        ("diterima", "di_lokasi") => true,
        ("di_lokasi", "selesai") => true,
        ("selesai", "ditutup") => true,
        _ => false,
    };

    if !valid_transition {
        return Err(AppError::Conflict(format!(
            "Transisi status dari '{}' ke '{}' tidak sah. Workflow SOP: BARU -> DITUGASKAN -> DITERIMA -> DI LOKASI -> SELESAI -> DITUTUP.",
            status_lama, status_baru
        )));
    }

    // ROLE PERMISSION PER STATUS
    match status_baru.as_str() {
        "diterima" | "di_lokasi" | "selesai" => {
            // Petugas yang ditugaskan ATAU Admin
            if auth_user.role == UserRole::Petugas {
                if incident.ditugaskan_ke != Some(auth_user.id) {
                    return Err(AppError::Forbidden("Anda hanya dapat memperbarui status insiden yang ditugaskan kepada Anda.".to_string()));
                }
            } else if auth_user.role != UserRole::Admin && auth_user.role != UserRole::Operator {
                return Err(AppError::Forbidden("Peran Anda tidak diizinkan memperbarui status ini.".to_string()));
            }
        }
        "ditutup" => {
            // Hanya Admin atau Operator yang berhak menutup insiden
            if auth_user.role != UserRole::Admin && auth_user.role != UserRole::Operator {
                return Err(AppError::Forbidden("Hanya Operator Command Center atau Administrator yang berwenang menutup insiden.".to_string()));
            }
        }
        _ => {}
    }

    let selesai_pada = if status_baru == "selesai" || status_baru == "ditutup" {
        incident.selesai_pada.or_else(|| Some(Utc::now()))
    } else {
        None
    };

    let mut tx = pool.begin().await?;

    let updated = sqlx::query_as!(
        Incident,
        r#"
        UPDATE incidents
        SET status = $1, selesai_pada = COALESCE(selesai_pada, $2), updated_at = NOW()
        WHERE id = $3
        RETURNING id, event_id, jenis, keparahan, status, lokasi, deskripsi, dibuat_oleh, ditugaskan_ke, dibuat_pada, selesai_pada, updated_at
        "#,
        status_baru,
        selesai_pada,
        id
    )
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query!(
        r#"
        INSERT INTO incident_updates (id, incident_id, status_lama, status_baru, catatan, oleh, waktu)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
        "#,
        id,
        status_lama,
        catatan,
        auth_user.id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "UPDATE_INCIDENT_STATUS",
        "incident",
        Some(id),
        Some(ip),
        serde_json::json!({
            "status_lama": status_lama,
            "status_baru": status_baru,
            "catatan": catatan
        }),
    )
    .await
    .ok();

    Ok(Json(updated))
}

pub async fn add_incident_note(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(payload): Json<AddIncidentNoteRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let catatan = payload.catatan.trim();
    if catatan.is_empty() {
        return Err(AppError::Validation("Catatan tidak boleh kosong.".to_string()));
    }

    let incident = sqlx::query!("SELECT id, status, ditugaskan_ke FROM incidents WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Insiden tidak ditemukan.".to_string()))?;

    if auth_user.role == UserRole::Petugas && incident.ditugaskan_ke != Some(auth_user.id) {
        return Err(AppError::Forbidden("Anda tidak memiliki akses ke insiden ini.".to_string()));
    }

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    sqlx::query!(
        r#"
        INSERT INTO incident_updates (id, incident_id, status_lama, status_baru, catatan, oleh, waktu)
        VALUES (gen_random_uuid(), $1, $2, $2, $3, $4, NOW())
        "#,
        id,
        incident.status,
        catatan,
        auth_user.id
    )
    .execute(&pool)
    .await?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "ADD_INCIDENT_NOTE",
        "incident",
        Some(id),
        Some(ip),
        serde_json::json!({"catatan": catatan}),
    )
    .await
    .ok();

    Ok(Json(serde_json::json!({"message": "Catatan berhasil ditambahkan."})))
}

