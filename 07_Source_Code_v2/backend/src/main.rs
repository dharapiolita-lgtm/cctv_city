use std::{net::SocketAddr, sync::Arc};
use axum::http::{
    header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    HeaderValue, Method,
};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod audit;
mod auth;
mod config;
mod errors;
mod handlers;
mod models;
mod routes;
mod simulator;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Inisialisasi Logging & Tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "waterwatch_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 2. Load Konfigurasi
    let config = Arc::new(config::AppConfig::from_env());
    tracing::info!("Memulai WaterWatch Backend di port {}...", config.port);

    // 3. Inisialisasi Koneksi PostgreSQL Pool
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&config.database_url)
        .await
        .map_err(|e| {
            tracing::error!("Gagal terhubung ke PostgreSQL: {}", e);
            e
        })?;

    tracing::info!("Terhubung ke database PostgreSQL waterwatch!");

    // 4. Jalankan Event Simulator di background
    let sim_pool = pool.clone();
    let sim_config = Arc::clone(&config);
    tokio::spawn(async move {
        simulator::run_event_simulator(sim_pool, sim_config).await;
    });

    // 5. Setup CORS
    let cors = CorsLayer::new()
        .allow_origin(
            config
                .frontend_origin
                .parse::<HeaderValue>()
                .unwrap_or_else(|_| HeaderValue::from_static("http://localhost:3000")),
        )
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE])
        .allow_credentials(true);

    // 6. Registrasi Router
    let app = routes::create_routes(pool).layer(cors);

    // 7. Bind Server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server WaterWatch aktif dan melayani request di http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
