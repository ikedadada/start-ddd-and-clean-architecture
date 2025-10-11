use std::sync::Arc;

use axum::extract::Json;
use axum::http::StatusCode;
use axum::response::IntoResponse;

use crate::application::usecase::create_todo_usecase::{CreateTodoInput, CreateTodoUsecase};
use crate::presentation::error::AppError;
use crate::presentation::middleware::ValidatedJson;

pub struct CreateTodoHandler {
    usecase: Arc<CreateTodoUsecase>,
}

impl CreateTodoHandler {
    pub fn new(usecase: Arc<CreateTodoUsecase>) -> Self {
        Self { usecase }
    }

    pub async fn handle(
        &self,
        ValidatedJson(payload): ValidatedJson<CreateTodoInput>,
    ) -> Result<impl IntoResponse, AppError> {
        let todo = self.usecase.execute(payload).await?;
        Ok((StatusCode::CREATED, Json(todo)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::{to_bytes, Body};
    use axum::http::{Request, StatusCode};
    use axum::routing::post;
    use axum::Router;
    use serde_json::Value;
    use tower::ServiceExt;

    use crate::application::usecase::test_support::InMemoryTodoRepository;

    #[tokio::test]
    async fn missing_title_returns_field_error() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let usecase = Arc::new(CreateTodoUsecase::new(repository));
        let handler = Arc::new(CreateTodoHandler::new(usecase));

        let app = Router::new().route(
            "/todos",
            post({
                let handler = handler.clone();
                move |payload| {
                    let handler = handler.clone();
                    async move { handler.handle(payload).await }
                }
            }),
        );

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/todos")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"description":"missing title"}"#))
                    .unwrap(),
            )
            .await
            .expect("request success");

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let bytes = to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("read body");
        let body: Value = serde_json::from_slice(&bytes).expect("json body");
        let message = body
            .get("message")
            .and_then(Value::as_str)
            .expect("message string");
        assert!(message.contains("missing field `title`"));
    }

    #[tokio::test]
    async fn empty_title_triggers_validator() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let usecase = Arc::new(CreateTodoUsecase::new(repository));
        let handler = Arc::new(CreateTodoHandler::new(usecase));

        let app = Router::new().route(
            "/todos",
            post({
                let handler = handler.clone();
                move |payload| {
                    let handler = handler.clone();
                    async move { handler.handle(payload).await }
                }
            }),
        );

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/todos")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"title":""}"#))
                    .unwrap(),
            )
            .await
            .expect("request success");

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let bytes = to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("read body");
        let body: Value = serde_json::from_slice(&bytes).expect("json body");
        let message = body
            .get("message")
            .and_then(Value::as_str)
            .expect("message string");
        assert!(message.contains("title"));
    }
}
