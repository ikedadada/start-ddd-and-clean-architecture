use std::sync::Arc;

use axum::Json;

use crate::application::usecase::get_all_todos_usecase::GetAllTodosUsecase;
use crate::domain::model::todo::TodoDto;
use crate::presentation::error::AppError;

pub struct GetAllTodosHandler {
    usecase: Arc<GetAllTodosUsecase>,
}

impl GetAllTodosHandler {
    pub fn new(usecase: Arc<GetAllTodosUsecase>) -> Self {
        Self { usecase }
    }

    pub async fn handle(&self) -> Result<Json<Vec<TodoDto>>, AppError> {
        let todos = self.usecase.execute().await?;
        Ok(Json(todos))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::{to_bytes, Body};
    use axum::http::Request;
    use axum::routing::get;
    use axum::Router;
    use serde_json::Value;
    use tower::ServiceExt;

    use crate::application::usecase::test_support::{insert_todo, InMemoryTodoRepository};

    #[tokio::test]
    async fn returns_all_todos_without_validation() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        insert_todo(repository.clone(), "todo-1", None).await;
        let usecase = Arc::new(GetAllTodosUsecase::new(repository));
        let handler = Arc::new(GetAllTodosHandler::new(usecase));

        let app = Router::new().route(
            "/todos",
            get({
                let handler = handler.clone();
                move || {
                    let handler = handler.clone();
                    async move { handler.handle().await }
                }
            }),
        );

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/todos")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("request success");

        assert!(response.status().is_success());
        let body = to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("read body");
        let json: Value = serde_json::from_slice(&body).expect("json body");
        assert_eq!(json.as_array().map(|arr| arr.len()), Some(1));
    }
}
