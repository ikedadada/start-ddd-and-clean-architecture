# Rust Todo API

This backend implements the Todo service using Axum and Sqlx following the
same layered Domain-Driven Design structure as the other language
implementations in this repository.

## Prerequisites

- Rust 1.90 or later (matching the `rust-toolchain.toml` in this directory)
- MySQL instance accessible via a `DATABASE_URL` environment variable

## Running locally

```bash
cd backend_rust
export DATABASE_URL="mysql://user:password@localhost:3306/todo_api"
cargo run
```

The server listens on port `3004` by default. Override by setting the `PORT`
environment variable.

## Project layout

- `src/domain`: Entities and repository abstractions
- `src/application`: Use cases and transaction orchestration
- `src/infrastructure`: Sqlx-backed repository and transaction service
- `src/presentation`: HTTP handlers, routing, and error mapping
- `src/main.rs`: Composition root wiring all layers together

## Running tests

Infrastructure-layer tests spin up a disposable MySQL instance via
[`testcontainers`](https://crates.io/crates/testcontainers). Ensure Docker is
available on your machine (the harness talks to the local daemon). The suite
shares a single container and provisions an isolated schema per test, so the
default parallel runner works fine:

```bash
cargo test
```
