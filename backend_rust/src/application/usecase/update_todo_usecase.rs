use std::sync::Arc;

use serde::Deserialize;
use uuid::Uuid;

use crate::application::error::UsecaseError;
use crate::application::service::transaction_service::TransactionService;
use crate::domain::model::todo::TodoDto;
use crate::domain::repository::todo_repository::TodoRepository;

#[derive(Debug, Deserialize)]
pub struct UpdateTodoInput {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
}

pub struct UpdateTodoUsecase<TS>
where
    TS: TransactionService,
{
    todo_repository: Arc<dyn TodoRepository>,
    transaction_service: Arc<TS>,
}

impl<TS> UpdateTodoUsecase<TS>
where
    TS: TransactionService,
{
    pub fn new(todo_repository: Arc<dyn TodoRepository>, transaction_service: Arc<TS>) -> Self {
        Self {
            todo_repository,
            transaction_service,
        }
    }

    pub async fn execute(&self, input: UpdateTodoInput) -> Result<TodoDto, UsecaseError> {
        let UpdateTodoInput {
            id,
            title,
            description,
        } = input;

        let title_value = title;
        let description_value = description;

        let repository = Arc::clone(&self.todo_repository);
        let todo = self
            .transaction_service
            .run(move || {
                let repository = Arc::clone(&repository);
                let title = title_value;
                let description = description_value;
                async move {
                    let mut todo = repository.find_by_id(&id).await?;
                    todo.update(title, description);
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
    use crate::application::usecase::test_support::{
        insert_todo, InMemoryTodoRepository, NoopTransactionService,
    };

    #[tokio::test]
    async fn update_changes_fields() {
        let repository = Arc::new(InMemoryTodoRepository::default());
        let transaction_service = Arc::new(NoopTransactionService);
        let id = insert_todo(repository.clone(), "title", Some("desc".to_string())).await;

        let usecase = UpdateTodoUsecase::new(repository.clone(), transaction_service);
        let dto = usecase
            .execute(UpdateTodoInput {
                id,
                title: "updated".to_string(),
                description: Some("changed".to_string()),
            })
            .await
            .expect("update succeeds");

        assert_eq!(dto.title, "updated");
        assert_eq!(dto.description.as_deref(), Some("changed"));

        let stored = repository.find_by_id(&id).await.unwrap();
        assert_eq!(stored.title(), "updated");
        assert_eq!(stored.description(), Some(&"changed".to_string()));
    }
}
