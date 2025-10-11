pub mod create_todo_usecase;
pub mod delete_todo_usecase;
pub mod get_all_todos_usecase;
pub mod get_todo_usecase;
pub mod mark_as_completed_todo_usecase;
pub mod mark_as_uncompleted_todo_usecase;
pub mod update_todo_usecase;

#[cfg(test)]
pub(crate) mod test_support {
    use async_trait::async_trait;
    use std::collections::HashMap;
    use std::sync::Arc;
    use tokio::sync::Mutex;
    use uuid::Uuid;

    use crate::application::error::UsecaseError;
    use crate::application::service::transaction_service::TransactionService;
    use crate::domain::model::todo::Todo;
    use crate::domain::repository::todo_repository::{RepositoryError, TodoRepository};

    #[derive(Clone, Default)]
    pub struct InMemoryTodoRepository {
        store: Arc<Mutex<HashMap<Uuid, Todo>>>,
    }

    #[async_trait]
    impl TodoRepository for InMemoryTodoRepository {
        async fn find_all(&self) -> Result<Vec<Todo>, RepositoryError> {
            let store = self.store.lock().await;
            Ok(store.values().cloned().collect())
        }

        async fn find_by_id(&self, id: &Uuid) -> Result<Todo, RepositoryError> {
            let store = self.store.lock().await;
            store.get(id).cloned().ok_or(RepositoryError::NotFound)
        }

        async fn save(&self, todo: &Todo) -> Result<(), RepositoryError> {
            let mut store = self.store.lock().await;
            store.insert(*todo.id(), todo.clone());
            Ok(())
        }

        async fn delete(&self, todo: &Todo) -> Result<(), RepositoryError> {
            let mut store = self.store.lock().await;
            store.remove(todo.id());
            Ok(())
        }
    }

    #[derive(Clone, Default)]
    pub struct NoopTransactionService;

    #[async_trait]
    impl TransactionService for NoopTransactionService {
        async fn run<F, Fut, T>(&self, operation: F) -> Result<T, UsecaseError>
        where
            F: FnOnce() -> Fut + Send,
            Fut: std::future::Future<Output = Result<T, UsecaseError>> + Send,
            T: Send,
        {
            operation().await
        }
    }

    pub async fn insert_todo(
        repository: Arc<InMemoryTodoRepository>,
        title: &str,
        description: Option<String>,
    ) -> Uuid {
        let todo = Todo::new(title.to_string(), description);
        let id = *todo.id();
        repository.save(&todo).await.unwrap();
        id
    }
}
