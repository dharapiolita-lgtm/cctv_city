use axum::{
    routing::{get, patch, post, put},
    Router,
};
use sqlx::PgPool;

use crate::handlers::{
    audit_handlers::list_audit_logs,
    auth_handlers::{login, logout, me},
    camera_handlers::{
        create_camera, deactivate_camera, get_camera, list_cameras, update_camera,
        update_camera_status,
    },
    dashboard_handlers::{
        get_dashboard_incidents, get_dashboard_summary, get_dashboard_trends,
    },
    event_handlers::{get_event, list_events, trigger_simulation, validate_event},
    incident_handlers::{
        add_incident_note, assign_incident, create_incident, get_incident, list_incidents,
        update_incident_status,
    },
    user_handlers::{
        create_user, get_user, list_users, reset_password, toggle_user_active, update_user,
    },
};

pub fn create_routes(pool: PgPool) -> Router {
    Router::new()
        // Auth
        .route("/api/auth/login", post(login))
        .route("/api/auth/logout", post(logout))
        .route("/api/auth/me", get(me))
        // Cameras
        .route("/api/cameras", get(list_cameras).post(create_camera))
        .route("/api/cameras/:id", get(get_camera).put(update_camera))
        .route("/api/cameras/:id/deactivate", patch(deactivate_camera))
        .route("/api/cameras/:id/status", patch(update_camera_status))
        // Detection Events
        .route("/api/events", get(list_events))
        .route("/api/events/:id", get(get_event))
        .route("/api/events/:id/validate", post(validate_event))
        .route("/api/events/simulate", post(trigger_simulation))
        // Incidents
        .route("/api/incidents", get(list_incidents).post(create_incident))
        .route("/api/incidents/:id", get(get_incident))
        .route("/api/incidents/:id/assign", patch(assign_incident))
        .route("/api/incidents/:id/status", patch(update_incident_status))
        .route("/api/incidents/:id/updates", post(add_incident_note))
        // Users
        .route("/api/users", get(list_users).post(create_user))
        .route("/api/users/:id", get(get_user).put(update_user))
        .route("/api/users/:id/active", patch(toggle_user_active))
        .route("/api/users/:id/reset-password", post(reset_password))
        // Dashboard
        .route("/api/dashboard/summary", get(get_dashboard_summary))
        .route("/api/dashboard/incidents", get(get_dashboard_incidents))
        .route("/api/dashboard/trends", get(get_dashboard_trends))
        // Audit Logs (Read-only for Admin)
        .route("/api/audit-logs", get(list_audit_logs))
        .with_state(pool)
}

