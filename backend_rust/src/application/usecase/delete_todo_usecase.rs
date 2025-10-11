use std::sync::Arc;

use uuid::Uuid;

use crate::application::error::UsecaseError;
use crate::application::service::transaction_service::TransactionService;
use crate::domain::repository::todo_repository::TodoRepository;

pub struct DeleteTodoUsecase<TS>
where
    TS: TransactionService,
{
    todo_repository: Arc<dyn TodoRepository>,
    transaction_service: Arc<TS>,
}

impl<TS> DeleteTodoUsecase<TS>
where
    TS: TransactionService,
{
    pub fn new(todo_repository: Arc<dyn TodoRepository>, transaction_service: Arc<TS>) -> Self {
        Self {
            todo_repository,
            transaction_service,
        }
    }

    pub async fn execute(&self, id: &Uuid) -> Result<(), UsecaseError> {
        let repository = Arc::clone(&self.todo_repository);
        let id = *id;

        self.transaction_service
            .run(move || {
                let repository = Arc::clone(&repository);
                async move {
                    let todo = repository.find_by_id(&id).await?;
                    repository.delete(&todo).await?;
                    Ok(())
                }
            })
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::usecase::test_support::{
        insert_todo, InMemoryTodoRepository, NoopTransactionService,
    };
    use crate::domain::repository::todo_repository::RepositoryError;

    #[tokio::test]
    async fn delete_removes_todo() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let transaction_service = Arc::new(NoopTransactionService);
        let id = insert_todo(repository.clone(), "title", None).await;

        let usecase = DeleteTodoUsecase::new(repository.clone(), transaction_service);
        usecase.execute(&id).await.expect("delete todo");

        let result = repository.find_by_id(&id).await;
        assert!(matches!(result, Err(RepositoryError::NotFound)));
    }
}
