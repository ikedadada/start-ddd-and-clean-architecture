use std::future::Future;
use std::sync::Arc;

use async_trait::async_trait;
use sqlx::Executor;

use crate::application::error::UsecaseError;
use crate::application::service::transaction_service::TransactionService;
use crate::domain::repository::todo_repository::RepositoryError;
use crate::infrastructure::repository::context_provider::ContextProviderImpl;

pub struct TransactionServiceImpl {
    context_provider: Arc<ContextProviderImpl>,
}

impl TransactionServiceImpl {
    pub fn new(context_provider: Arc<ContextProviderImpl>) -> Self {
        Self { context_provider }
    }
}

#[async_trait]
impl TransactionService for TransactionServiceImpl {
    async fn run<F, Fut, T>(&self, operation: F) -> Result<T, UsecaseError>
    where
        F: FnOnce() -> Fut + Send,
        Fut: Future<Output = Result<T, UsecaseError>> + Send,
        T: Send,
    {
        let provider = self.context_provider.clone();
        let mut operation = Some(operation);

        let scoped_result = provider
            .run_scoped(|| {
                let provider = provider.clone();
                let operation = operation.take().expect("operation available");
                async move {
                    {
                        let mut connection = provider.connection().await?;
                        if let Err(err) = connection.execute("BEGIN").await {
                            return Ok(Err(UsecaseError::from(RepositoryError::data_access(err))));
                        }
                    }

                    let operation_result = operation().await;

                    let mut connection = provider.connection().await?;
                    let outcome = match operation_result {
                        Ok(value) => {
                            if let Err(err) = connection.execute("COMMIT").await {
                                Err(UsecaseError::from(RepositoryError::data_access(err)))
                            } else {
                                Ok(value)
                            }
                        }
                        Err(err) => {
                            if let Err(rollback_err) = connection.execute("ROLLBACK").await {
                                Err(UsecaseError::from(RepositoryError::data_access(
                                    rollback_err,
                                )))
                            } else {
                                Err(err)
                            }
                        }
                    };

                    Ok(outcome)
                }
            })
            .await
            .map_err(RepositoryError::from);

        match scoped_result {
            Ok(inner) => match inner {
                Ok(value) => Ok(value),
                Err(err) => Err(err),
            },
            Err(repo_err) => Err(UsecaseError::from(repo_err)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use sqlx::MySqlPool;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::Arc;
    use uuid::Uuid;

    use crate::infrastructure::test_support::mysql::TestSchema;

    fn build_subject(pool: MySqlPool) -> (Arc<ContextProviderImpl>, TransactionServiceImpl) {
        let provider = Arc::new(ContextProviderImpl::new(pool));
        let service = TransactionServiceImpl::new(provider.clone());
        (provider, service)
    }

    #[tokio::test]
    async fn commits_on_successful_operation() -> Result<()> {
        let schema = TestSchema::new().await?;
        let (provider, service) = build_subject(schema.pool().clone());

        let todo_id = Uuid::now_v7();

        let result: Result<Uuid, UsecaseError> = service
            .run(|| {
                let provider = provider.clone();
                async move {
                    let mut connection = provider
                        .connection()
                        .await
                        .map_err(RepositoryError::from)
                        .map_err(UsecaseError::from)?;
                    sqlx::query(
                        "INSERT INTO todos (id, title, description, completed) VALUES (?, ?, ?, ?)",
                    )
                    .bind(todo_id.to_string())
                    .bind("title")
                    .bind(None::<String>)
                    .bind(false)
                    .execute(connection.as_mut())
                    .await
                    .map_err(|err| UsecaseError::from(RepositoryError::data_access(err)))?;
                    Ok(todo_id)
                }
            })
            .await;

        assert_eq!(result.unwrap(), todo_id);

        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM todos WHERE id = ?")
            .bind(todo_id.to_string())
            .fetch_one(schema.pool())
            .await?;

        drop(service);
        drop(provider);
        drop(schema);
        assert_eq!(count, 1);
        Ok(())
    }

    #[tokio::test]
    async fn rolls_back_when_operation_fails() -> Result<()> {
        let schema = TestSchema::new().await?;
        let (provider, service) = build_subject(schema.pool().clone());

        let todo_id = Uuid::now_v7();

        let result = service
            .run(|| {
                let provider = provider.clone();
                async move {
                    let mut connection = provider
                        .connection()
                        .await
                        .map_err(RepositoryError::from)
                        .map_err(UsecaseError::from)?;
                    sqlx::query(
                        "INSERT INTO todos (id, title, description, completed) VALUES (?, ?, ?, ?)",
                    )
                    .bind(todo_id.to_string())
                    .bind("title")
                    .bind(None::<String>)
                    .bind(false)
                    .execute(connection.as_mut())
                    .await
                    .map_err(|err| UsecaseError::from(RepositoryError::data_access(err)))?;
                    Err::<(), UsecaseError>(UsecaseError::Conflict("failed".into()))
                }
            })
            .await;

        assert!(matches!(result, Err(UsecaseError::Conflict(_))));

        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM todos WHERE id = ?")
            .bind(todo_id.to_string())
            .fetch_one(schema.pool())
            .await?;

        drop(service);
        drop(provider);
        drop(schema);
        assert_eq!(count, 0);
        Ok(())
    }

    #[tokio::test]
    async fn executes_operation_once() -> Result<()> {
        let schema = TestSchema::new().await?;
        let (_, service) = build_subject(schema.pool().clone());

        let calls = Arc::new(AtomicUsize::new(0));

        service
            .run(|| {
                let calls = calls.clone();
                async move {
                    calls.fetch_add(1, Ordering::SeqCst);
                    Ok::<_, UsecaseError>(())
                }
            })
            .await?;

        drop(service);
        drop(schema);
        assert_eq!(calls.load(Ordering::SeqCst), 1);
        Ok(())
    }
}
