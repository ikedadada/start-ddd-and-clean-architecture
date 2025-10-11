use axum::extract::rejection::{JsonRejection, PathRejection};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use axum_valid::validator::ValidRejection;
use serde::Serialize;

use crate::application::error::UsecaseError;

#[derive(Debug, Serialize)]
struct ErrorBody {
    code: String,
    message: String,
}

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    NotFound(String),
    Conflict(String),
    Internal(String),
}

impl From<UsecaseError> for AppError {
    fn from(value: UsecaseError) -> Self {
        match value {
            UsecaseError::Validation(message) => AppError::BadRequest(message),
            UsecaseError::NotFound => AppError::NotFound("Todo not found".to_string()),
            UsecaseError::Conflict(message) => AppError::Conflict(message),
            UsecaseError::Unexpected(err) => AppError::Internal(err.to_string()),
        }
    }
}

impl From<JsonRejection> for AppError {
    fn from(rejection: JsonRejection) -> Self {
        AppError::BadRequest(rejection.body_text())
    }
}

impl From<PathRejection> for AppError {
    fn from(rejection: PathRejection) -> Self {
        AppError::BadRequest(rejection.body_text())
    }
}

impl<E> From<ValidRejection<E>> for AppError
where
    AppError: From<E>,
{
    fn from(rejection: ValidRejection<E>) -> Self {
        match rejection {
            ValidRejection::Valid(errors) => AppError::BadRequest(errors.to_string()),
            ValidRejection::Inner(inner) => AppError::from(inner),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };
        let body = ErrorBody {
            code: status.as_str().to_string(),
            message,
        };
        (status, Json(body)).into_response()
    }
}
