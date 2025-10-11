use std::future::Future;
use std::sync::Arc;

use sqlx::mysql::MySqlPool;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use thiserror::Error;
use tokio::sync::{Mutex, OwnedMutexGuard};

use crate::domain::repository::todo_repository::RepositoryError;

tokio::task_local! {
    static CONNECTION_SLOT: ConnectionSlot;
}

#[derive(Clone)]
struct ConnectionSlot {
    connection: Arc<Mutex<PoolConnection<MySql>>>,
}

#[derive(Debug, Error)]
pub enum ContextError {
    #[error("no active connection in context")]
    NoActiveConnection,
    #[error("failed to acquire connection")]
    Acquire(#[source] sqlx::Error),
}

impl From<ContextError> for RepositoryError {
    fn from(value: ContextError) -> Self {
        match value {
            ContextError::NoActiveConnection => {
                RepositoryError::data_access(ContextError::NoActiveConnection)
            }
            ContextError::Acquire(err) => RepositoryError::data_access(err),
        }
    }
}

pub struct ConnectionGuard {
    guard: OwnedMutexGuard<PoolConnection<MySql>>,
}

impl ConnectionGuard {
    pub fn new(guard: OwnedMutexGuard<PoolConnection<MySql>>) -> Self {
        Self { guard }
    }
}

impl std::ops::Deref for ConnectionGuard {
    type Target = PoolConnection<MySql>;

    fn deref(&self) -> &Self::Target {
        &self.guard
    }
}

impl std::ops::DerefMut for ConnectionGuard {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.guard
    }
}

#[derive(Clone)]
pub struct ContextProviderImpl {
    pool: MySqlPool,
}

impl ContextProviderImpl {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }

    pub async fn run_scoped<F, Fut, T>(&self, run: F) -> Result<T, ContextError>
    where
        F: FnOnce() -> Fut + Send,
        Fut: Future<Output = Result<T, ContextError>> + Send,
        T: Send,
    {
        if CONNECTION_SLOT.try_with(|_| ()).is_ok() {
            return run().await;
        }

        let connection = self.pool.acquire().await.map_err(ContextError::Acquire)?;
        let connection = Arc::new(Mutex::new(connection));

        CONNECTION_SLOT
            .scope(
                ConnectionSlot {
                    connection: connection.clone(),
                },
                async move { run().await },
            )
            .await
    }

    pub async fn connection(&self) -> Result<ConnectionGuard, ContextError> {
        let slot = CONNECTION_SLOT
            .try_with(|slot| slot.clone())
            .map_err(|_| ContextError::NoActiveConnection)?;
        let guard = slot.connection.clone().lock_owned().await;
        Ok(ConnectionGuard::new(guard))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::test_support::mysql::TestSchema;
    use anyhow::Result;

    #[tokio::test]
    async fn connection_outside_scope_fails() -> Result<()> {
        let schema = TestSchema::new().await?;
        let provider = Arc::new(ContextProviderImpl::new(schema.pool().clone()));

        let result = provider.connection().await;

        drop(provider);
        drop(schema);
        assert!(matches!(result, Err(ContextError::NoActiveConnection)));
        Ok(())
    }

    #[tokio::test]
    async fn run_scoped_reuses_same_connection() -> Result<()> {
        let schema = TestSchema::new().await?;
        let provider = Arc::new(ContextProviderImpl::new(schema.pool().clone()));

        let (outer_id, inner_id) = provider
            .run_scoped(|| {
                let provider = provider.clone();
                async move {
                    let outer_id = {
                        let mut outer = provider.connection().await?;
                        let id = sqlx::query_scalar::<_, u64>("SELECT CONNECTION_ID()")
                            .fetch_one(outer.as_mut())
                            .await
                            .map_err(ContextError::Acquire)?;
                        id
                    };

                    let inner_id = provider
                        .run_scoped(|| {
                            let provider = provider.clone();
                            async move {
                                let mut inner = provider.connection().await?;
                                let id = sqlx::query_scalar::<_, u64>("SELECT CONNECTION_ID()")
                                    .fetch_one(inner.as_mut())
                                    .await
                                    .map_err(ContextError::Acquire)?;
                                Ok::<_, ContextError>(id)
                            }
                        })
                        .await?;

                    Ok::<_, ContextError>((outer_id, inner_id))
                }
            })
            .await?;

        drop(provider);
        drop(schema);
        assert_eq!(outer_id, inner_id);
        Ok(())
    }

    #[tokio::test]
    async fn run_scoped_propagates_acquire_error() -> Result<()> {
        let schema = TestSchema::new().await?;
        let provider = Arc::new(ContextProviderImpl::new(schema.pool().clone()));

        let pool = schema.pool().clone();
        pool.close().await;

        let result = provider
            .run_scoped(|| async { Ok::<_, ContextError>(()) })
            .await;

        drop(provider);
        drop(schema);
        assert!(matches!(result, Err(ContextError::Acquire(_))));
        Ok(())
    }
}
