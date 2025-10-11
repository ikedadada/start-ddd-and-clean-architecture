use std::sync::Arc;

use axum::Json;

use crate::application::usecase::get_todo_usecase::GetTodoUsecase;
use crate::domain::model::todo::TodoDto;
use crate::presentation::error::AppError;
use crate::presentation::handler::path::TodoPathParams;
use crate::presentation::middleware::ValidatedPath;

pub struct GetTodoHandler {
    usecase: Arc<GetTodoUsecase>,
}

impl GetTodoHandler {
    pub fn new(usecase: Arc<GetTodoUsecase>) -> Self {
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
    use axum::routing::get;
    use axum::Router;
    use serde_json::Value;
    use tower::ServiceExt;

    use crate::application::usecase::test_support::InMemoryTodoRepository;

    #[tokio::test]
    async fn invalid_path_returns_uuid_error() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let usecase = Arc::new(GetTodoUsecase::new(repository));
        let handler = Arc::new(GetTodoHandler::new(usecase));

        let app = Router::new().route(
            "/todos/:id",
            get({
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
                    .method("GET")
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
