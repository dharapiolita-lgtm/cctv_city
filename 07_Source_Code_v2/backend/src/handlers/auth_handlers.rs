use std::sync::Arc;
use axum::{extract::State, http::HeaderMap, Json};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};

use crate::{
    audit::log_audit,
    auth::{create_jwt, verify_password, AuthUser},
    config::AppConfig,
    errors::AppError,
    models::{User, UserProfile},
};

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserProfile,
}

pub async fn login(
    State(pool): State<sqlx::PgPool>,
    headers: HeaderMap,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let config = AppConfig::from_env();
    let ip = headers
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .or_else(|| headers.get("x-real-ip").and_then(|h| h.to_str().ok()))
        .unwrap_or("127.0.0.1");

    let username = payload.username.trim();
    if username.is_empty() || payload.password.is_empty() {
        return Err(AppError::BadRequest("Nama pengguna dan kata sandi wajib diisi.".to_string()));
    }

    // 1. Cari user berdasarkan username
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at
        FROM users
        WHERE username = $1
        "#,
        username
    )
    .fetch_optional(&pool)
    .await?;

    let mut user = match user {
        Some(u) => u,
        None => {
            log_audit(
                &pool,
                None,
                "LOGIN_FAILED",
                "user",
                None,
                Some(ip),
                serde_json::json!({"username": username, "alasan": "Pengguna tidak ditemukan"}),
            )
            .await
            .ok();
            return Err(AppError::Unauthorized("Nama pengguna atau kata sandi tidak sesuai.".to_string()));
        }
    };

    // 2. Cek apakah akun aktif
    if !user.aktif {
        return Err(AppError::Unauthorized("Akun Anda telah dinonaktifkan oleh administrator.".to_string()));
    }

    // 3. Cek apakah akun sedang terkunci
    let now = Utc::now();
    if let Some(locked_until) = user.locked_until {
        if locked_until > now {
            let sisa_menit = (locked_until - now).num_minutes() + 1;
            return Err(AppError::AccountLocked(format!(
                "Akun terkunci sementara karena terlalu banyak percobaan gagal. Silakan coba kembali dalam {} menit.",
                sisa_menit
            )));
        }
    }

    // 4. Verifikasi kata sandi
    let password_valid = verify_password(&user.password_hash, &payload.password);

    if !password_valid {
        let new_failed = user.failed_login_attempts + 1;
        let mut locked_until_new = None;

        if new_failed >= config.login_max_attempts {
            locked_until_new = Some(now + Duration::minutes(config.login_lock_minutes));
            tracing::warn!("Akun '{}' dikunci hingga {:?}", user.username, locked_until_new);
        }

        sqlx::query!(
            r#"
            UPDATE users
            SET failed_login_attempts = $1, locked_until = $2, updated_at = NOW()
            WHERE id = $3
            "#,
            new_failed,
            locked_until_new,
            user.id
        )
        .execute(&pool)
        .await?;

        log_audit(
            &pool,
            Some(user.id),
            "LOGIN_FAILED",
            "user",
            Some(user.id),
            Some(ip),
            serde_json::json!({
                "username": user.username,
                "failed_attempts": new_failed,
                "locked": locked_until_new.is_some()
            }),
        )
        .await
        .ok();

        if locked_until_new.is_some() {
            return Err(AppError::AccountLocked(format!(
                "Batas percobaan gagal ({}) terlampaui. Akun dikunci sementara selama {} menit.",
                config.login_max_attempts, config.login_lock_minutes
            )));
        } else {
            let sisa_kesempatan = config.login_max_attempts - new_failed;
            return Err(AppError::Unauthorized(format!(
                "Nama pengguna atau kata sandi salah. Sisa percobaan: {}.",
                sisa_kesempatan
            )));
        }
    }

    // 5. Login Sukses: reset percobaan gagal dan update last_login_at
    sqlx::query!(
        r#"
        UPDATE users
        SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW()
        WHERE id = $1
        "#,
        user.id
    )
    .execute(&pool)
    .await?;

    let token = create_jwt(user.id, &user.username, &user.nama, &user.role, &config)?;

    log_audit(
        &pool,
        Some(user.id),
        "LOGIN_SUCCESS",
        "user",
        Some(user.id),
        Some(ip),
        serde_json::json!({"username": user.username, "role": user.role}),
    )
    .await
    .ok();

    user.last_login_at = Some(now);

    Ok(Json(LoginResponse {
        token,
        user: UserProfile::from(user),
    }))
}

pub async fn logout(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, AppError> {
    let ip = headers
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("127.0.0.1");

    log_audit(
        &pool,
        Some(auth_user.id),
        "LOGOUT",
        "user",
        Some(auth_user.id),
        Some(ip),
        serde_json::json!({"username": auth_user.username}),
    )
    .await
    .ok();

    Ok(Json(serde_json::json!({
        "message": "Sesi berhasil diakhiri."
    })))
}

pub async fn me(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
) -> Result<Json<UserProfile>, AppError> {
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at
        FROM users
        WHERE id = $1
        "#,
        auth_user.id
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(UserProfile::from(user)))
}

