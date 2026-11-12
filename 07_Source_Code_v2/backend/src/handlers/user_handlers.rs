use axum::{
    extract::{Path, Query, State},
    http::HeaderMap,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    audit::log_audit,
    auth::{hash_password, AuthUser},
    errors::AppError,
    models::{PaginatedResponse, User, UserProfile, UserRole},
};

#[derive(Debug, Deserialize)]
pub struct UserQuery {
    pub role: Option<String>,
    pub aktif: Option<bool>,
    pub q: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub nama: String,
    pub username: String,
    pub email: Option<String>,
    pub password: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub nama: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>,
    pub aktif: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ResetPasswordRequest {
    pub new_password: String,
}

pub async fn list_users(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Query(query): Query<UserQuery>,
) -> Result<Json<PaginatedResponse<UserProfile>>, AppError> {
    // Only Admin can list all users
    auth_user.require_role(&[UserRole::Admin, UserRole::Operator])?;

    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut sql = String::from("SELECT id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at FROM users WHERE 1=1");
    let mut count_sql = String::from("SELECT COUNT(*) FROM users WHERE 1=1");

    if let Some(ref r) = query.role {
        if !r.is_empty() && r != "all" {
            let r_clean = r.trim().replace('\'', "''");
            sql.push_str(&format!(" AND role = '{}'", r_clean));
            count_sql.push_str(&format!(" AND role = '{}'", r_clean));
        }
    }

    if let Some(ak) = query.aktif {
        sql.push_str(&format!(" AND aktif = {}", ak));
        count_sql.push_str(&format!(" AND aktif = {}", ak));
    }

    if let Some(ref q) = query.q {
        let q_clean = q.trim().replace('\'', "''");
        if !q_clean.is_empty() {
            sql.push_str(&format!(" AND (nama ILIKE '%{}%' OR username ILIKE '%{}%')", q_clean, q_clean));
            count_sql.push_str(&format!(" AND (nama ILIKE '%{}%' OR username ILIKE '%{}%')", q_clean, q_clean));
        }
    }

    sql.push_str(&format!(" ORDER BY created_at DESC LIMIT {} OFFSET {}", per_page, offset));

    let users: Vec<User> = sqlx::query_as(&sql).fetch_all(&pool).await?;
    let total: (i64,) = sqlx::query_as(&count_sql).fetch_one(&pool).await?;

    let profiles: Vec<UserProfile> = users.into_iter().map(UserProfile::from).collect();

    Ok(Json(PaginatedResponse {
        data: profiles,
        meta: crate::models::Meta {
            page,
            per_page,
            total: total.0,
        },
    }))
}

pub async fn get_user(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<UserProfile>, AppError> {
    auth_user.require_role(&[UserRole::Admin])?;

    let user = sqlx::query_as!(
        User,
        r#"
        SELECT id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at
        FROM users
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Pengguna tidak ditemukan.".to_string()))?;

    Ok(Json(UserProfile::from(user)))
}

pub async fn create_user(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    headers: HeaderMap,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<UserProfile>, AppError> {
    auth_user.require_role(&[UserRole::Admin])?;

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    let username = payload.username.trim().to_lowercase();
    let nama = payload.nama.trim();

    if username.is_empty() || nama.is_empty() || payload.password.is_empty() {
        return Err(AppError::Validation("Nama, username, dan password wajib diisi.".to_string()));
    }

    let role = payload.role.trim().to_lowercase();
    if !["admin", "operator", "petugas", "pimpinan"].contains(&role.as_str()) {
        return Err(AppError::Validation("Role pengguna harus: admin, operator, petugas, atau pimpinan.".to_string()));
    }

    // Check duplicate username
    let existing = sqlx::query!("SELECT id FROM users WHERE username = $1", username)
        .fetch_optional(&pool)
        .await?;

    if existing.is_some() {
        return Err(AppError::Conflict("Username tersebut sudah digunakan.".to_string()));
    }

    let password_hash = hash_password(&payload.password)?;
    let id = Uuid::new_v4();

    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, 0, NULL, NULL, NOW(), NOW())
        RETURNING id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at
        "#,
        id,
        nama,
        username,
        payload.email.as_deref(),
        password_hash,
        role
    )
    .fetch_one(&pool)
    .await?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "CREATE_USER",
        "user",
        Some(user.id),
        Some(ip),
        serde_json::json!({
            "username": user.username,
            "role": user.role
        }),
    )
    .await
    .ok();

    Ok(Json(UserProfile::from(user)))
}

pub async fn update_user(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<UserProfile>, AppError> {
    auth_user.require_role(&[UserRole::Admin])?;

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    let existing = sqlx::query_as!(
        User,
        "SELECT id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at FROM users WHERE id = $1",
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Pengguna tidak ditemukan.".to_string()))?;

    let nama = payload.nama.unwrap_or(existing.nama);
    let email = payload.email.or(existing.email);
    let role = payload.role.unwrap_or(existing.role);
    let aktif = payload.aktif.unwrap_or(existing.aktif);

    if !["admin", "operator", "petugas", "pimpinan"].contains(&role.as_str()) {
        return Err(AppError::Validation("Role pengguna tidak valid.".to_string()));
    }

    let updated = sqlx::query_as!(
        User,
        r#"
        UPDATE users
        SET nama = $1, email = $2, role = $3, aktif = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at
        "#,
        nama,
        email,
        role,
        aktif,
        id
    )
    .fetch_one(&pool)
    .await?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "UPDATE_USER",
        "user",
        Some(id),
        Some(ip),
        serde_json::json!({
            "username": updated.username,
            "role": updated.role,
            "aktif": updated.aktif
        }),
    )
    .await
    .ok();

    Ok(Json(UserProfile::from(updated)))
}

pub async fn toggle_user_active(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> Result<Json<UserProfile>, AppError> {
    auth_user.require_role(&[UserRole::Admin])?;

    if auth_user.id == id {
        return Err(AppError::BadRequest("Anda tidak dapat menonaktifkan akun sendiri.".to_string()));
    }

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");

    let updated = sqlx::query_as!(
        User,
        r#"
        UPDATE users
        SET aktif = NOT aktif, updated_at = NOW()
        WHERE id = $1
        RETURNING id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at
        "#,
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Pengguna tidak ditemukan.".to_string()))?;

    log_audit(
        &pool,
        Some(auth_user.id),
        "TOGGLE_USER_ACTIVE",
        "user",
        Some(id),
        Some(ip),
        serde_json::json!({
            "username": updated.username,
            "aktif": updated.aktif
        }),
    )
    .await
    .ok();

    Ok(Json(UserProfile::from(updated)))
}

pub async fn reset_password(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(payload): Json<ResetPasswordRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    auth_user.require_role(&[UserRole::Admin])?;

    if payload.new_password.len() < 6 {
        return Err(AppError::Validation("Kata sandi baru minimal 6 karakter.".to_string()));
    }

    let ip = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("127.0.0.1");
    let new_hash = hash_password(&payload.new_password)?;

    let result = sqlx::query!(
        r#"
        UPDATE users
        SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
        WHERE id = $2
        "#,
        new_hash,
        id
    )
    .execute(&pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Pengguna tidak ditemukan.".to_string()));
    }

    log_audit(
        &pool,
        Some(auth_user.id),
        "RESET_PASSWORD",
        "user",
        Some(id),
        Some(ip),
        serde_json::json!({"action": "admin reset password"}),
    )
    .await
    .ok();

    Ok(Json(serde_json::json!({
        "message": "Kata sandi pengguna berhasil diatur ulang."
    })))
}

