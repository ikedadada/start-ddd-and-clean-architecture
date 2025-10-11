use async_trait::async_trait;
use thiserror::Error;
use uuid::Uuid;

use crate::domain::model::todo::Todo;

#[derive(Debug, Error)]
pub enum RepositoryError {
    #[error("todo not found")]
    NotFound,
    #[error("storage error")]
    DataAccess {
        #[source]
        source: Box<dyn std::error::Error + Send + Sync>,
    },
}

impl RepositoryError {
    pub fn data_access<E>(error: E) -> Self
    where
        E: std::error::Error + Send + Sync + 'static,
    {
        RepositoryError::DataAccess {
            source: Box::new(error),
        }
    }
}

#[async_trait]
pub trait TodoRepository: Send + Sync {
    async fn find_all(&self) -> Result<Vec<Todo>, RepositoryError>;
    async fn find_by_id(&self, id: &Uuid) -> Result<Todo, RepositoryError>;
    async fn save(&self, todo: &Todo) -> Result<(), RepositoryError>;
    #[allow(dead_code)]
    async fn delete(&self, todo: &Todo) -> Result<(), RepositoryError>;
}
