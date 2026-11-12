use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;

pub async fn log_audit(
    pool: &PgPool,
    user_id: Option<Uuid>,
    aksi: &str,
    objek_tipe: &str,
    objek_id: Option<Uuid>,
    ip: Option<&str>,
    detail: serde_json::Value,
) -> Result<(), AppError> {
    sqlx::query!(
        r#"
        INSERT INTO audit_logs (id, user_id, aksi, objek_tipe, objek_id, ip, waktu, detail)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), $6)
        "#,
        user_id,
        aksi,
        objek_tipe,
        objek_id,
        ip,
        detail
    )
    .execute(pool)
    .await
    .map_err(|e| {
        tracing::error!("Gagal mencatat audit log: {}", e);
        AppError::from(e)
    })?;

    Ok(())
}

