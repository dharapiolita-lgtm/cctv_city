use std::sync::Arc;
use chrono::Utc;
use rand::Rng;
use sqlx::PgPool;
use tokio::time::{sleep, Duration};
use uuid::Uuid;

use crate::{config::AppConfig, models::Camera};

pub async fn run_event_simulator(pool: PgPool, config: Arc<AppConfig>) {
    if !config.event_simulator_enabled {
        tracing::info!("Event Simulator dinonaktifkan melalui konfigurasi.");
        return;
    }

    tracing::info!(
        "Event Simulator berjalan dengan interval {} detik...",
        config.event_simulator_interval_seconds
    );

    let interval = Duration::from_secs(config.event_simulator_interval_seconds);

    loop {
        sleep(interval).await;

        if let Err(e) = simulate_random_event(&pool, &config).await {
            tracing::warn!("Gagal menghasilkan simulasi event: {}", e);
        }
    }
}

pub async fn simulate_random_event(
    pool: &PgPool,
    config: &AppConfig,
) -> Result<Option<Uuid>, sqlx::Error> {
    // 1. Ambil kamera yang berstatus ONLINE saja
    let online_cameras = sqlx::query_as!(
        Camera,
        r#"
        SELECT id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at
        FROM cameras
        WHERE status = 'online'
        "#
    )
    .fetch_all(pool)
    .await?;

    if online_cameras.is_empty() {
        tracing::debug!("Tidak ada kamera online untuk simulator event.");
        return Ok(None);
    }

    let mut rng = rand::thread_rng();
    let camera = &online_cameras[rng.gen_range(0..online_cameras.len())];

    let event_types = ["suspicious_activity", "crowd", "accident", "fire"];
    let jenis = event_types[rng.gen_range(0..event_types.len())];

    // Confidence score between threshold and 0.98
    let min_score = config.event_confidence_threshold.max(0.60);
    let skor: f64 = (rng.gen_range((min_score * 1000.0) as u32..=980) as f64) / 1000.0;

    let snapshot_path = format!("/demo/snapshots/{}_1.jpg", jenis);
    let clip_path = format!("/demo/clips/{}_1.mp4", jenis);
    let event_id = Uuid::new_v4();

    sqlx::query!(
        r#"
        INSERT INTO detection_events (id, camera_id, jenis, skor, waktu_deteksi, snapshot_path, clip_path, validasi, divalidasi_oleh, divalidasi_pada, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, NULL, $5)
        "#,
        event_id,
        camera.id,
        jenis,
        skor,
        Utc::now(),
        snapshot_path,
        clip_path
    )
    .execute(pool)
    .await?;

    tracing::info!(
        "Simulator: Event baru terdeteksi [ID: {}, Jenis: {}, Skor: {:.2}, Kamera: {}]",
        event_id,
        jenis,
        skor,
        camera.nama
    );

    Ok(Some(event_id))
}

