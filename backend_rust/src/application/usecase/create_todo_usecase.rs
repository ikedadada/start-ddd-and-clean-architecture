use std::sync::Arc;

use serde::Deserialize;
use validator::Validate;

use crate::application::error::UsecaseError;
use crate::domain::model::todo::{Todo, TodoDto};
use crate::domain::repository::todo_repository::TodoRepository;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateTodoInput {
    #[validate(length(min = 1))]
    pub title: String,
    pub description: Option<String>,
}

pub struct CreateTodoUsecase {
    todo_repository: Arc<dyn TodoRepository>,
}

impl CreateTodoUsecase {
    pub fn new(todo_repository: Arc<dyn TodoRepository>) -> Self {
        Self { todo_repository }
    }

    pub async fn execute(&self, input: CreateTodoInput) -> Result<TodoDto, UsecaseError> {
        let todo = Todo::new(input.title, input.description);
        self.todo_repository.save(&todo).await?;
        Ok(todo.to_dto())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::usecase::test_support::InMemoryTodoRepository;
    use uuid::Uuid;

    #[tokio::test]
    async fn create_persists_todo() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let usecase = CreateTodoUsecase::new(repository.clone());

        let result = usecase
            .execute(CreateTodoInput {
                title: "in-memory".to_string(),
                description: Some("desc".to_string()),
            })
            .await
            .expect("create todo");

        let stored = repository
            .find_by_id(&Uuid::parse_str(&result.id).unwrap())
            .await
            .expect("todo saved");
        assert_eq!(stored.title(), "in-memory");
        assert_eq!(stored.description(), Some(&"desc".to_string()));
        assert!(!stored.completed());
    }
}
