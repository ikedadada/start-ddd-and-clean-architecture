use std::sync::Arc;

use axum::Json;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use crate::application::service::transaction_service::TransactionService;
use crate::application::usecase::mark_as_uncompleted_todo_usecase::MarkAsUncompletedTodoUsecase;
use crate::domain::model::todo::TodoDto;
use crate::presentation::error::AppError;
use crate::presentation::middleware::validate::validate_uuid;
use crate::presentation::middleware::ValidatedPath;

#[derive(Debug, Deserialize, Validate)]
pub(crate) struct TodoPathParams {
    #[validate(custom = "validate_uuid")]
    id: String,
}

impl TodoPathParams {
    fn into_uuid(self) -> Uuid {
        Uuid::parse_str(&self.id).expect("uuid validated")
    }
}

pub struct MarkAsUncompletedTodoHandler<TS>
where
    TS: TransactionService,
{
    usecase: Arc<MarkAsUncompletedTodoUsecase<TS>>,
}

impl<TS> MarkAsUncompletedTodoHandler<TS>
where
    TS: TransactionService,
{
    pub fn new(usecase: Arc<MarkAsUncompletedTodoUsecase<TS>>) -> Self {
        Self { usecase }
    }

    pub async fn handle(
        &self,
        ValidatedPath(path): ValidatedPath<TodoPathParams>,
    ) -> Result<Json<TodoDto>, AppError> {
        let id = path.into_uuid();
        let todo = self.usecase.execute(&id).await?;
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

    use crate::application::usecase::test_support::{
        InMemoryTodoRepository, NoopTransactionService,
    };

    #[tokio::test]
    async fn invalid_path_returns_uuid_error() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let transaction_service = Arc::new(NoopTransactionService);
        let usecase = Arc::new(MarkAsUncompletedTodoUsecase::new(
            repository,
            transaction_service,
        ));
        let handler = Arc::new(MarkAsUncompletedTodoHandler::new(usecase));

        let app = Router::new().route(
            "/todos/:id/uncomplete",
            put({
                let handler = handler.clone();
                move |path| {
                    let handler = handler.clone();
                    async move { handler.handle(path).await }
                }
            }),
        );

        let response = app
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/todos/not-a-uuid/uncomplete")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("request success");

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let bytes = to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("read body");
        let body: serde_json::Value = serde_json::from_slice(&bytes).expect("json body");
        let message = body
            .get("message")
            .and_then(Value::as_str)
            .expect("message string");
        assert!(message.contains("uuid"));
    }
}
