use std::sync::Arc;

use axum::Json;
use serde::Deserialize;
use validator::Validate;

use crate::application::service::transaction_service::TransactionService;
use crate::application::usecase::update_todo_usecase::{UpdateTodoInput, UpdateTodoUsecase};
use crate::domain::model::todo::TodoDto;
use crate::presentation::error::AppError;
use crate::presentation::handler::path::TodoPathParams;
use crate::presentation::middleware::{ValidatedJson, ValidatedPath};

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateTodoPayload {
    #[validate(length(min = 1))]
    pub title: String,
    pub description: Option<String>,
}

pub struct UpdateTodoHandler<TS>
where
    TS: TransactionService,
{
    usecase: Arc<UpdateTodoUsecase<TS>>,
}

impl<TS> UpdateTodoHandler<TS>
where
    TS: TransactionService,
{
    pub fn new(usecase: Arc<UpdateTodoUsecase<TS>>) -> Self {
        Self { usecase }
    }

    pub async fn handle(
        &self,
        ValidatedPath(path): ValidatedPath<TodoPathParams>,
        ValidatedJson(payload): ValidatedJson<UpdateTodoPayload>,
    ) -> Result<Json<TodoDto>, AppError> {
        let id = path.into_uuid();
        let input = UpdateTodoInput {
            id,
            title: payload.title,
            description: payload.description,
        };
        let todo = self.usecase.execute(input).await?;
        Ok(Json(todo))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::{to_bytes, Body};
    use axum::http::{Request, StatusCode};
    use axum::routing::put;
    use axum::Router;
    use serde_json::Value;
    use tower::ServiceExt;
    use uuid::Uuid;

    use crate::application::usecase::test_support::{
        InMemoryTodoRepository, NoopTransactionService,
    };

    #[tokio::test]
    async fn invalid_path_reports_uuid_error() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let transaction_service = Arc::new(NoopTransactionService);
        let usecase = Arc::new(UpdateTodoUsecase::new(repository, transaction_service));
        let handler = Arc::new(UpdateTodoHandler::new(usecase));

        let app = Router::new().route(
            "/todos/:id",
            put({
                let handler = handler.clone();
                move |path, payload| {
                    let handler = handler.clone();
                    async move { handler.handle(path, payload).await }
                }
            }),
        );

        let response = app
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/todos/not-a-uuid")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"title":"updated"}"#))
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
        assert!(message.contains("uuid"));
    }

    #[tokio::test]
    async fn invalid_payload_reports_field_error() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let transaction_service = Arc::new(NoopTransactionService);
        let usecase = Arc::new(UpdateTodoUsecase::new(repository, transaction_service));
        let handler = Arc::new(UpdateTodoHandler::new(usecase));
        let id = Uuid::now_v7();

        let app = Router::new().route(
            "/todos/:id",
            put({
                let handler = handler.clone();
                move |path, payload| {
                    let handler = handler.clone();
                    async move { handler.handle(path, payload).await }
                }
            }),
        );

        let response = app
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri(format!("/todos/{id}"))
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
