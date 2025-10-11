use std::sync::Arc;

use axum::http::StatusCode;

use crate::application::service::transaction_service::TransactionService;
use crate::application::usecase::delete_todo_usecase::DeleteTodoUsecase;
use crate::presentation::error::AppError;
use crate::presentation::handler::path::TodoPathParams;
use crate::presentation::middleware::ValidatedPath;

pub struct DeleteTodoHandler<TS>
where
    TS: TransactionService,
{
    usecase: Arc<DeleteTodoUsecase<TS>>,
}

impl<TS> DeleteTodoHandler<TS>
where
    TS: TransactionService,
{
    pub fn new(usecase: Arc<DeleteTodoUsecase<TS>>) -> Self {
        Self { usecase }
    }

    pub async fn handle(
        &self,
        ValidatedPath(path): ValidatedPath<TodoPathParams>,
    ) -> Result<StatusCode, AppError> {
        let id = path.into_uuid();
        self.usecase.execute(&id).await?;
        Ok(StatusCode::NO_CONTENT)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::{to_bytes, Body};
    use axum::http::{Request, StatusCode};
    use axum::routing::delete;
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
        let usecase = Arc::new(DeleteTodoUsecase::new(repository, transaction_service));
        let handler = Arc::new(DeleteTodoHandler::new(usecase));

        let app = Router::new().route(
            "/todos/:id",
            delete({
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
                    .method("DELETE")
                    .uri("/todos/not-a-uuid")
                    .body(Body::empty())
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
}
