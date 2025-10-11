use std::sync::Arc;

use crate::application::error::UsecaseError;
use crate::domain::model::todo::TodoDto;
use crate::domain::repository::todo_repository::TodoRepository;

pub struct GetAllTodosUsecase {
    todo_repository: Arc<dyn TodoRepository>,
}

impl GetAllTodosUsecase {
    pub fn new(todo_repository: Arc<dyn TodoRepository>) -> Self {
        Self { todo_repository }
    }

    pub async fn execute(&self) -> Result<Vec<TodoDto>, UsecaseError> {
        let todos = self.todo_repository.find_all().await?;
        Ok(todos.into_iter().map(|todo| todo.to_dto()).collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::usecase::test_support::{insert_todo, InMemoryTodoRepository};

    #[tokio::test]
    async fn returns_all_todos() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        insert_todo(repository.clone(), "todo-1", None).await;
        insert_todo(repository.clone(), "todo-2", Some("desc".into())).await;

        let usecase = GetAllTodosUsecase::new(repository);
        let todos = usecase.execute().await.expect("fetch todos");

        assert_eq!(todos.len(), 2);
        let titles: Vec<_> = todos.into_iter().map(|todo| todo.title).collect();
        assert!(titles.contains(&"todo-1".to_string()));
        assert!(titles.contains(&"todo-2".to_string()));
    }
}
