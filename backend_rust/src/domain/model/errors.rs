use thiserror::Error;

#[derive(Debug, Error, Clone, PartialEq, Eq)]
#[error("todo is already completed")]
pub struct TodoAlreadyCompletedError;

#[derive(Debug, Error, Clone, PartialEq, Eq)]
#[error("todo is not completed")]
pub struct TodoNotCompletedError;
