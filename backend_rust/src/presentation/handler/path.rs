use std::borrow::Cow;

use serde::Deserialize;
use uuid::Uuid;
use validator::{Validate, ValidationError};

#[derive(Debug, Deserialize, Validate)]
pub struct TodoPathParams {
    #[validate(custom = "validate_uuid")]
    pub id: String,
}

impl TodoPathParams {
    pub fn into_uuid(self) -> Uuid {
        Uuid::parse_str(&self.id).expect("uuid validated")
    }
}

fn validate_uuid(value: &str) -> Result<(), ValidationError> {
    Uuid::parse_str(value).map(|_| ()).map_err(|_| {
        let mut error = ValidationError::new("uuid");
        error.add_param(Cow::from("value"), &value);
        error
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use validator::Validate;

    #[test]
    fn invalid_uuid_fails_validation() {
        let params = TodoPathParams {
            id: "not-a-uuid".to_string(),
        };

        assert!(params.validate().is_err());
    }
}
