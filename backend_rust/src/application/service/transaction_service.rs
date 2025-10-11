use std::future::Future;

use async_trait::async_trait;

use crate::application::error::UsecaseError;

#[async_trait]
pub trait TransactionService: Send + Sync {
    async fn run<F, Fut, T>(&self, operation: F) -> Result<T, UsecaseError>
    where
        F: FnOnce() -> Fut + Send,
        Fut: Future<Output = Result<T, UsecaseError>> + Send,
        T: Send;
}
