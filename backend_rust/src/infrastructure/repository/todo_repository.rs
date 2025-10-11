use std::sync::Arc;

use async_trait::async_trait;
use sqlx::mysql::{MySqlConnection, MySqlRow};
use sqlx::Row;
use uuid::Uuid;

use crate::domain::model::todo::Todo;
use crate::domain::repository::todo_repository::{RepositoryError, TodoRepository};
use crate::infrastructure::repository::context_provider::ContextProviderImpl;

const SELECT_PROJECTION: &str = "SELECT id, title, description, completed FROM todos";

pub struct TodoRepositoryImpl {
    context_provider: Arc<ContextProviderImpl>,
}

impl TodoRepositoryImpl {
    pub fn new(context_provider: Arc<ContextProviderImpl>) -> Self {
        Self { context_provider }
    }

    fn map_row(row: MySqlRow) -> Result<Todo, RepositoryError> {
        let id: String = row.try_get("id").map_err(RepositoryError::data_access)?;
        let title: String = row.try_get("title").map_err(RepositoryError::data_access)?;
        let description: Option<String> = row
            .try_get("description")
            .map_err(RepositoryError::data_access)?;
        let completed: bool = row
            .try_get("completed")
            .map_err(RepositoryError::data_access)?;

        let uuid = Uuid::parse_str(&id).map_err(RepositoryError::data_access)?;
        Ok(Todo::reconstruct(uuid, title, description, completed))
    }

    async fn fetch_all(executor: &mut MySqlConnection) -> Result<Vec<Todo>, RepositoryError> {
        let rows = sqlx::query(SELECT_PROJECTION)
            .fetch_all(executor)
            .await
            .map_err(RepositoryError::data_access)?;

        rows.into_iter()
            .map(Self::map_row)
            .collect::<Result<Vec<_>, _>>()
    }

    async fn fetch_by_id(
        executor: &mut MySqlConnection,
        id: &Uuid,
    ) -> Result<Todo, RepositoryError> {
        let row = sqlx::query(&format!("{SELECT_PROJECTION} WHERE id = ?"))
            .bind(id.to_string())
            .fetch_optional(executor)
            .await
            .map_err(RepositoryError::data_access)?;

        match row {
            Some(row) => Self::map_row(row),
            None => Err(RepositoryError::NotFound),
        }
    }

    async fn persist(executor: &mut MySqlConnection, todo: &Todo) -> Result<(), RepositoryError> {
        sqlx::query(
            r#"
            INSERT INTO todos (id, title, description, completed)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                description = VALUES(description),
                completed = VALUES(completed)
            "#,
        )
        .bind(todo.id().to_string())
        .bind(todo.title())
        .bind(todo.description().map(|value| value.as_str()))
        .bind(todo.completed())
        .execute(executor)
        .await
        .map_err(RepositoryError::data_access)?;
        Ok(())
    }

    async fn remove(executor: &mut MySqlConnection, todo: &Todo) -> Result<(), RepositoryError> {
        sqlx::query("DELETE FROM todos WHERE id = ?")
            .bind(todo.id().to_string())
            .execute(executor)
            .await
            .map_err(RepositoryError::data_access)?;
        Ok(())
    }
}

#[async_trait]
impl TodoRepository for TodoRepositoryImpl {
    async fn find_all(&self) -> Result<Vec<Todo>, RepositoryError> {
        let provider = self.context_provider.clone();
        provider
            .run_scoped(|| {
                let provider = provider.clone();
                async move {
                    let mut connection = provider.connection().await?;
                    Ok(Self::fetch_all(connection.as_mut()).await)
                }
            })
            .await
            .map_err(RepositoryError::from)?
    }

    async fn find_by_id(&self, id: &Uuid) -> Result<Todo, RepositoryError> {
        let id = *id;
        let provider = self.context_provider.clone();
        provider
            .run_scoped(|| {
                let provider = provider.clone();
                async move {
                    let mut connection = provider.connection().await?;
                    Ok(Self::fetch_by_id(connection.as_mut(), &id).await)
                }
            })
            .await
            .map_err(RepositoryError::from)?
    }

    async fn save(&self, todo: &Todo) -> Result<(), RepositoryError> {
        let todo = todo.clone();
        let provider = self.context_provider.clone();
        provider
            .run_scoped(|| {
                let provider = provider.clone();
                async move {
                    let mut connection = provider.connection().await?;
                    Ok(Self::persist(connection.as_mut(), &todo).await)
                }
            })
            .await
            .map_err(RepositoryError::from)?
    }

    async fn delete(&self, todo: &Todo) -> Result<(), RepositoryError> {
        let todo = todo.clone();
        let provider = self.context_provider.clone();
        provider
            .run_scoped(|| {
                let provider = provider.clone();
                async move {
                    let mut connection = provider.connection().await?;
                    Ok(Self::remove(connection.as_mut(), &todo).await)
                }
            })
            .await
            .map_err(RepositoryError::from)?
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::test_support::mysql::TestSchema;
    use anyhow::Result;
    use sqlx::MySqlPool;
    use std::sync::Arc;

    fn build_subject(pool: MySqlPool) -> Arc<TodoRepositoryImpl> {
        let provider = Arc::new(ContextProviderImpl::new(pool));
        Arc::new(TodoRepositoryImpl::new(provider))
    }

    #[tokio::test]
    async fn save_and_find_by_id_roundtrip() -> Result<()> {
        let schema = TestSchema::new().await?;
        let repository = build_subject(schema.pool().clone());

        let todo = Todo::new("test title", Some("desc".to_string()));
        repository.save(&todo).await?;

        let fetched = repository.find_by_id(todo.id()).await?;

        drop(repository);
        drop(schema);
        assert_eq!(fetched.id(), todo.id());
        assert_eq!(fetched.title(), todo.title());
        assert_eq!(fetched.description(), todo.description());
        assert_eq!(fetched.completed(), todo.completed());
        Ok(())
    }

    #[tokio::test]
    async fn find_all_returns_all_records() -> Result<()> {
        let schema = TestSchema::new().await?;
        let repository = build_subject(schema.pool().clone());

        let first = Todo::new("first", None);
        let second = Todo::new("second", Some("desc".to_string()));
        repository.save(&first).await?;
        repository.save(&second).await?;

        let mut todos = repository.find_all().await?;
        todos.sort_by_key(|todo| todo.title().to_string());

        drop(repository);
        drop(schema);
        assert_eq!(todos.len(), 2);
        assert_eq!(todos[0].title(), "first");
        assert_eq!(todos[1].title(), "second");
        Ok(())
    }

    #[tokio::test]
    async fn save_updates_existing_record() -> Result<()> {
        let schema = TestSchema::new().await?;
        let repository = build_subject(schema.pool().clone());

        let mut todo = Todo::new("initial", None);
        repository.save(&todo).await?;

        todo.update("updated", Some("desc".to_string()));
        repository.save(&todo).await?;

        let fetched = repository.find_by_id(todo.id()).await?;
        drop(repository);
        drop(schema);
        assert_eq!(fetched.title(), "updated");
        assert_eq!(fetched.description(), Some(&"desc".to_string()));
        Ok(())
    }

    #[tokio::test]
    async fn delete_removes_record() -> Result<()> {
        let schema = TestSchema::new().await?;
        let repository = build_subject(schema.pool().clone());

        let todo = Todo::new("to delete", None);
        repository.save(&todo).await?;

        repository.delete(&todo).await?;

        let result = repository.find_by_id(todo.id()).await;
        drop(repository);
        drop(schema);
        assert!(matches!(result, Err(RepositoryError::NotFound)));
        Ok(())
    }

    #[tokio::test]
    async fn invalid_row_surfaces_as_data_access_error() -> Result<()> {
        let schema = TestSchema::new().await?;
        let repository = build_subject(schema.pool().clone());

        sqlx::query(
            r#"
            INSERT INTO todos (id, title, description, completed)
            VALUES (?, 'bad', NULL, false)
            "#,
        )
        .bind("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
        .execute(schema.pool())
        .await?;

        let result = repository.find_all().await;
        drop(repository);
        drop(schema);
        assert!(matches!(result, Err(RepositoryError::DataAccess { .. })));
        Ok(())
    }
}
