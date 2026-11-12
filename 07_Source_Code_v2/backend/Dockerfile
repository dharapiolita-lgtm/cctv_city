# Production Dockerfile for Rust Axum Backend
FROM rust:1.80-alpine as builder

RUN apk add --no-cache musl-dev pkgconfig openssl-dev

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

RUN cargo build --release

# Runtime image
FROM alpine:3.20

RUN apk add --no-cache ca-certificates libgcc

WORKDIR /app
COPY --from=builder /app/target/release/waterwatch-backend /app/waterwatch-backend

EXPOSE 8080

CMD ["/app/waterwatch-backend"]

