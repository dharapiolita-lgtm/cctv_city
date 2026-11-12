use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration_minutes: i64,
    pub port: u16,
    pub frontend_origin: String,
    pub login_max_attempts: i32,
    pub login_lock_minutes: i64,
    pub event_simulator_enabled: bool,
    pub event_simulator_interval_seconds: u64,
    pub event_confidence_threshold: f64,
}

impl AppConfig {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://openpg:openpgpwd@127.0.0.1:5432/waterwatch".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "waterwatch-super-secret-jwt-key-2026-cctv-secure-dev".to_string()),
            jwt_expiration_minutes: env::var("JWT_EXPIRATION_MINUTES")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(480), // 8 hours default for operator shift
            port: env::var("PORT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(8080),
            frontend_origin: env::var("FRONTEND_ORIGIN")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            login_max_attempts: env::var("LOGIN_MAX_ATTEMPTS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
            login_lock_minutes: env::var("LOGIN_LOCK_MINUTES")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(15),
            event_simulator_enabled: env::var("EVENT_SIMULATOR_ENABLED")
                .map(|v| v == "true" || v == "1")
                .unwrap_or(true),
            event_simulator_interval_seconds: env::var("EVENT_SIMULATOR_INTERVAL_SECONDS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(30),
            event_confidence_threshold: env::var("EVENT_CONFIDENCE_THRESHOLD")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(0.60),
        }
    }
}

