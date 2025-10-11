use std::sync::Arc;

use uuid::Uuid;

use crate::application::error::UsecaseError;
use crate::domain::model::todo::TodoDto;
use crate::domain::repository::todo_repository::TodoRepository;

pub struct GetTodoUsecase {
    todo_repository: Arc<dyn TodoRepository>,
}

impl GetTodoUsecase {
    pub fn new(todo_repository: Arc<dyn TodoRepository>) -> Self {
        Self { todo_repository }
    }

    pub async fn execute(&self, id: &Uuid) -> Result<TodoDto, UsecaseError> {
        let todo = self.todo_repository.find_by_id(id).await?;
        Ok(todo.to_dto())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::usecase::test_support::{insert_todo, InMemoryTodoRepository};

    #[tokio::test]
    async fn returns_single_todo() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let id = insert_todo(repository.clone(), "single", Some("desc".into())).await;

        let usecase = GetTodoUsecase::new(repository);
        let dto = usecase.execute(&id).await.expect("fetch todo");

        assert_eq!(dto.title, "single");
        assert_eq!(dto.description.as_deref(), Some("desc"));
        assert_eq!(Uuid::parse_str(&dto.id).unwrap(), id);
    }
}
