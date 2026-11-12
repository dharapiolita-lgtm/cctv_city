# ==============================================================================
# WATERWATCH V3 SECURE — RUST AXUM PRODUCTION DOCKERFILE
# Multi-stage lightweight Alpine build (< 30 MB runtime)
# Compatible with Railway, Render, Fly.io, and AWS ECS
# ==============================================================================

# Build Stage
FROM rust:1.80-alpine as builder

RUN apk add --no-cache musl-dev pkgconfig openssl-dev

WORKDIR /app

# Cache dependency layer
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy real source code & migrations
COPY src ./src
COPY migrations ./migrations

# Build production binary with musl optimization
RUN touch src/main.rs
RUN cargo build --release

# Runtime Stage
FROM alpine:3.20

RUN apk add --no-cache ca-certificates libgcc tzdata
ENV TZ=Asia/Jakarta

WORKDIR /app
COPY --from=builder /app/target/release/waterwatch-backend /app/waterwatch-backend

EXPOSE 8080

# Run binary
CMD ["/app/waterwatch-backend"]

