use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts},
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use chrono::{Duration, Utc};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use uuid::Uuid;

use crate::{config::AppConfig, errors::AppError, models::UserRole};

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String, // user_id
    pub username: String,
    pub nama: String,
    pub role: String,
    pub exp: i64,
    pub iat: i64,
}

pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| AppError::Internal(format!("Gagal mengenkripsi kata sandi: {}", e)))
}

pub fn verify_password(hash: &str, password: &str) -> bool {
    if let Ok(parsed_hash) = PasswordHash::new(hash) {
        Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok()
    } else {
        false
    }
}

pub fn create_jwt(
    user_id: Uuid,
    username: &str,
    nama: &str,
    role: &str,
    config: &AppConfig,
) -> Result<String, AppError> {
    let now = Utc::now();
    let exp = now + Duration::minutes(config.jwt_expiration_minutes);

    let header_json = r#"{"alg":"HS256","typ":"JWT"}"#;
    let header_b64 = URL_SAFE_NO_PAD.encode(header_json.as_bytes());

    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        nama: nama.to_string(),
        role: role.to_string(),
        exp: exp.timestamp(),
        iat: now.timestamp(),
    };

    let payload_json = serde_json::to_string(&claims)
        .map_err(|e| AppError::Internal(format!("Gagal serialisasi claims: {}", e)))?;
    let payload_b64 = URL_SAFE_NO_PAD.encode(payload_json.as_bytes());

    let signing_input = format!("{}.{}", header_b64, payload_b64);

    let mut mac = HmacSha256::new_from_slice(config.jwt_secret.as_bytes())
        .map_err(|e| AppError::Internal(format!("Gagal inisialisasi HMAC: {}", e)))?;
    mac.update(signing_input.as_bytes());
    let signature = mac.finalize().into_bytes();
    let signature_b64 = URL_SAFE_NO_PAD.encode(signature);

    Ok(format!("{}.{}", signing_input, signature_b64))
}

pub fn verify_jwt(token: &str, secret: &str) -> Result<Claims, AppError> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err(AppError::Unauthorized("Format token tidak valid.".to_string()));
    }

    let signing_input = format!("{}.{}", parts[0], parts[1]);
    let signature_bytes = URL_SAFE_NO_PAD
        .decode(parts[2])
        .map_err(|_| AppError::Unauthorized("Format tanda tangan token tidak valid.".to_string()))?;

    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|e| AppError::Internal(format!("Gagal inisialisasi HMAC: {}", e)))?;
    mac.update(signing_input.as_bytes());

    mac.verify_slice(&signature_bytes)
        .map_err(|_| AppError::Unauthorized("Tanda tangan token tidak valid atau telah dimodifikasi.".to_string()))?;

    let payload_bytes = URL_SAFE_NO_PAD
        .decode(parts[1])
        .map_err(|_| AppError::Unauthorized("Payload token tidak valid.".to_string()))?;

    let claims: Claims = serde_json::from_slice(&payload_bytes)
        .map_err(|_| AppError::Unauthorized("Claims token tidak dapat dibaca.".to_string()))?;

    let now = Utc::now().timestamp();
    if claims.exp < now {
        return Err(AppError::Unauthorized("Sesi login telah kedaluwarsa. Silakan masuk kembali.".to_string()));
    }

    Ok(claims)
}

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub username: String,
    pub nama: String,
    pub role: UserRole,
}

impl AuthUser {
    pub fn require_role(&self, allowed: &[UserRole]) -> Result<(), AppError> {
        if allowed.contains(&self.role) {
            Ok(())
        } else {
            Err(AppError::Forbidden(format!(
                "Akses ditolak. Peran '{}' tidak memiliki izin untuk tindakan ini.",
                self.role
            )))
        }
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|val| val.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("Header otorisasi (Authorization) diperlukan.".to_string()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized("Header otorisasi harus menggunakan skema Bearer.".to_string()));
        }

        let token = &auth_header[7..];
        let config = AppConfig::from_env();
        let claims = verify_jwt(token, &config.jwt_secret)?;

        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Unauthorized("ID Pengguna dalam token tidak valid.".to_string()))?;

        let role = claims
            .role
            .parse::<UserRole>()
            .map_err(|e| AppError::Unauthorized(e))?;

        Ok(AuthUser {
            id: user_id,
            username: claims.username,
            nama: claims.nama,
            role,
        })
    }
}
