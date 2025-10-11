use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::errors::{TodoAlreadyCompletedError, TodoNotCompletedError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoDto {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub completed: bool,
}

#[derive(Debug, Clone)]
pub struct Todo {
    id: Uuid,
    title: String,
    description: Option<String>,
    completed: bool,
}

impl Todo {
    pub fn new<T: Into<String>>(title: T, description: Option<String>) -> Self {
        Self {
            id: Uuid::now_v7(),
            title: title.into(),
            description,
            completed: false,
        }
    }

    pub fn reconstruct(
        id: Uuid,
        title: String,
        description: Option<String>,
        completed: bool,
    ) -> Self {
        Self {
            id,
            title,
            description,
            completed,
        }
    }

    pub fn id(&self) -> &Uuid {
        &self.id
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    pub fn description(&self) -> Option<&String> {
        self.description.as_ref()
    }

    pub fn completed(&self) -> bool {
        self.completed
    }

    pub fn update<T: Into<String>>(&mut self, title: T, description: Option<String>) {
        self.title = title.into();
        self.description = description;
    }

    pub fn mark_as_completed(&mut self) -> Result<(), TodoAlreadyCompletedError> {
        if self.completed {
            return Err(TodoAlreadyCompletedError);
        }
        self.completed = true;
        Ok(())
    }

    pub fn mark_as_uncompleted(&mut self) -> Result<(), TodoNotCompletedError> {
        if !self.completed {
            return Err(TodoNotCompletedError);
        }
        self.completed = false;
        Ok(())
    }

    pub fn to_dto(&self) -> TodoDto {
        TodoDto {
            id: self.id.to_string(),
            title: self.title.clone(),
            description: self.description.clone(),
            completed: self.completed,
        }
    }
}

impl From<TodoDto> for Todo {
    fn from(dto: TodoDto) -> Self {
        let id = Uuid::parse_str(&dto.id).expect("invalid UUID stored in DTO");
        Self {
            id,
            title: dto.title,
            description: dto.description,
            completed: dto.completed,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::model::errors::{TodoAlreadyCompletedError, TodoNotCompletedError};

    #[test]
    fn new_todo_initializes_with_defaults() {
        let todo = Todo::new("title", Some("desc".to_string()));

        assert_eq!(todo.title(), "title");
        assert_eq!(todo.description(), Some(&"desc".to_string()));
        assert!(!todo.completed());
    }

    #[test]
    fn update_replaces_title_and_description() {
        let mut todo = Todo::new("title", Some("desc".to_string()));

        todo.update("new title", None);

        assert_eq!(todo.title(), "new title");
        assert_eq!(todo.description(), None);
    }

    #[test]
    fn mark_as_completed_sets_flag_and_prevents_duplicate() {
        let mut todo = Todo::new("title", None);

        assert!(todo.mark_as_completed().is_ok());
        assert!(todo.completed());
        assert!(matches!(
            todo.mark_as_completed(),
            Err(TodoAlreadyCompletedError)
        ));
    }

    #[test]
    fn mark_as_uncompleted_requires_completed_state() {
        let mut todo = Todo::new("title", None);

        assert!(matches!(
            todo.mark_as_uncompleted(),
            Err(TodoNotCompletedError)
        ));

        todo.mark_as_completed().unwrap();
        assert!(todo.mark_as_uncompleted().is_ok());
        assert!(!todo.completed());
    }

    #[test]
    fn dto_roundtrip_preserves_content() {
        let mut todo = Todo::new("title", Some("desc".to_string()));
        todo.mark_as_completed().unwrap();

        let dto = todo.to_dto();
        let reconstructed = Todo::from(dto);

        assert_eq!(reconstructed.title(), "title");
        assert_eq!(reconstructed.description(), Some(&"desc".to_string()));
        assert!(reconstructed.completed());
    }
}
