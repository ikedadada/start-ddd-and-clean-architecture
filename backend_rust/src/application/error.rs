use thiserror::Error;

use crate::domain::model::errors::{TodoAlreadyCompletedError, TodoNotCompletedError};
use crate::domain::repository::todo_repository::RepositoryError;

#[derive(Debug, Error)]
pub enum UsecaseError {
    #[allow(dead_code)]
    #[error("validation error: {0}")]
    Validation(String),
    #[error("todo not found")]
    NotFound,
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("unexpected error")]
    Unexpected(#[source] Box<dyn std::error::Error + Send + Sync>),
}

impl UsecaseError {
    pub fn conflict_from_already_completed(error: TodoAlreadyCompletedError) -> Self {
        Self::Conflict(error.to_string())
    }

    pub fn conflict_from_not_completed(error: TodoNotCompletedError) -> Self {
        Self::Conflict(error.to_string())
    }
}

impl From<RepositoryError> for UsecaseError {
    fn from(error: RepositoryError) -> Self {
        match error {
            RepositoryError::NotFound => UsecaseError::NotFound,
            RepositoryError::DataAccess { source } => UsecaseError::Unexpected(source),
        }
    }
}
