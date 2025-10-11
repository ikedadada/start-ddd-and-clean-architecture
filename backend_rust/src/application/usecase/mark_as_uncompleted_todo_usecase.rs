use std::sync::Arc;

use uuid::Uuid;

use crate::application::error::UsecaseError;
use crate::application::service::transaction_service::TransactionService;
use crate::domain::model::todo::TodoDto;
use crate::domain::repository::todo_repository::TodoRepository;

pub struct MarkAsUncompletedTodoUsecase<TS>
where
    TS: TransactionService,
{
    todo_repository: Arc<dyn TodoRepository>,
    transaction_service: Arc<TS>,
}

impl<TS> MarkAsUncompletedTodoUsecase<TS>
where
    TS: TransactionService,
{
    pub fn new(todo_repository: Arc<dyn TodoRepository>, transaction_service: Arc<TS>) -> Self {
        Self {
            todo_repository,
            transaction_service,
        }
    }

    pub async fn execute(&self, id: &Uuid) -> Result<TodoDto, UsecaseError> {
        let repository = Arc::clone(&self.todo_repository);
        let id = *id;
        let todo = self
            .transaction_service
            .run(move || {
                let repository = Arc::clone(&repository);
                async move {
                    let mut todo = repository.find_by_id(&id).await?;
                    todo.mark_as_uncompleted()
                        .map_err(UsecaseError::conflict_from_not_completed)?;
                    repository.save(&todo).await?;
                    Ok(todo)
                }
            })
            .await?;

        Ok(todo.to_dto())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::usecase::mark_as_completed_todo_usecase::MarkAsCompletedTodoUsecase;
    use crate::application::usecase::test_support::{
        insert_todo, InMemoryTodoRepository, NoopTransactionService,
    };

    #[tokio::test]
    async fn mark_uncompleted_clears_flag() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let transaction_service = Arc::new(NoopTransactionService);
        let id = insert_todo(repository.clone(), "title", None).await;

        let complete_usecase =
            MarkAsCompletedTodoUsecase::new(repository.clone(), transaction_service.clone());
        complete_usecase.execute(&id).await.unwrap();

        let usecase = MarkAsUncompletedTodoUsecase::new(repository.clone(), transaction_service);
        let dto = usecase.execute(&id).await.expect("mark uncompleted");

        assert!(!dto.completed);
        let stored = repository.find_by_id(&id).await.unwrap();
        assert!(!stored.completed());
    }
}
