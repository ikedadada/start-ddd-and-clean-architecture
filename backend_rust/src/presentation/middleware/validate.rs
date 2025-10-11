use std::borrow::Cow;

use async_trait::async_trait;
use axum::body::Body;
use axum::extract::{FromRequest, FromRequestParts, Json, Path};
use axum::http::{request::Parts, Request};
use axum_valid::Valid;
use serde::de::DeserializeOwned;
use uuid::Uuid;
use validator::{Validate, ValidationError};

use crate::presentation::error::AppError;

pub struct ValidatedJson<T>(pub T);

pub struct ValidatedPath<T>(pub T);

pub fn validate_uuid(value: &str) -> Result<(), ValidationError> {
    Uuid::parse_str(value).map(|_| ()).map_err(|_| {
        let mut error = ValidationError::new("uuid");
        error.add_param(Cow::from("value"), &value);
        error
    })
}

#[async_trait]
impl<S, T> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned + Validate + Send,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request(req: Request<Body>, state: &S) -> Result<Self, Self::Rejection> {
        let Valid(Json(value)) = Valid::<Json<T>>::from_request(req, state)
            .await
            .map_err(AppError::from)?;
        Ok(Self(value))
    }
}

#[async_trait]
impl<S, T> FromRequestParts<S> for ValidatedPath<T>
where
    T: DeserializeOwned + Validate + Send,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let Valid(Path(value)) = Valid::<Path<T>>::from_request_parts(parts, state)
            .await
            .map_err(AppError::from)?;
        Ok(Self(value))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invalid_uuid_is_rejected() {
        let result = validate_uuid("not-a-uuid");
        assert!(result.is_err());
    }

    #[test]
    fn valid_uuid_is_accepted() {
        let value = Uuid::now_v7().to_string();
        let result = validate_uuid(&value);
        assert!(result.is_ok());
    }
}
