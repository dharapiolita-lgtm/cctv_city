use axum::{
    extract::{Query, State},
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    errors::AppError,
    models::{AuditLogWithUser, PaginatedResponse, UserRole},
};

#[derive(Debug, Deserialize)]
pub struct AuditQuery {
    pub aksi: Option<String>,
    pub objek_tipe: Option<String>,
    pub user_id: Option<Uuid>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

pub async fn list_audit_logs(
    State(pool): State<sqlx::PgPool>,
    auth_user: AuthUser,
    Query(query): Query<AuditQuery>,
) -> Result<Json<PaginatedResponse<AuditLogWithUser>>, AppError> {
    // Audit logs strictly accessible only by Admin
    auth_user.require_role(&[UserRole::Admin])?;

    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut sql = String::from(r#"
        SELECT 
            a.id, a.user_id, u.nama as user_nama, u.username, u.role as user_role,
            a.aksi, a.objek_tipe, a.objek_id, a.ip, a.waktu, a.detail
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
    "#);

    let mut count_sql = String::from("SELECT COUNT(*) FROM audit_logs WHERE 1=1");

    if let Some(ref ak) = query.aksi {
        if !ak.is_empty() && ak != "all" {
            let ak_clean = ak.trim().replace('\'', "''");
            sql.push_str(&format!(" AND a.aksi = '{}'", ak_clean));
            count_sql.push_str(&format!(" AND aksi = '{}'", ak_clean));
        }
    }

    if let Some(ref obj) = query.objek_tipe {
        if !obj.is_empty() && obj != "all" {
            let obj_clean = obj.trim().replace('\'', "''");
            sql.push_str(&format!(" AND a.objek_tipe = '{}'", obj_clean));
            count_sql.push_str(&format!(" AND objek_tipe = '{}'", obj_clean));
        }
    }

    if let Some(uid) = query.user_id {
        sql.push_str(&format!(" AND a.user_id = '{}'", uid));
        count_sql.push_str(&format!(" AND user_id = '{}'", uid));
    }

    sql.push_str(&format!(" ORDER BY a.waktu DESC LIMIT {} OFFSET {}", per_page, offset));

    let logs: Vec<AuditLogWithUser> = sqlx::query_as(&sql).fetch_all(&pool).await?;
    let total: (i64,) = sqlx::query_as(&count_sql).fetch_one(&pool).await?;

    Ok(Json(PaginatedResponse {
        data: logs,
        meta: crate::models::Meta {
            page,
            per_page,
            total: total.0,
        },
    }))
}

