#[cfg(test)]
pub(crate) mod mysql {
    use std::sync::Arc;
    use std::time::Duration;

    use anyhow::Result;
    use sqlx::mysql::MySqlPoolOptions;
    use sqlx::{query, MySqlPool};
    use testcontainers::core::{IntoContainerPort, WaitFor};
    use testcontainers::runners::AsyncRunner;
    use testcontainers::{ContainerAsync, GenericImage, ImageExt};
    use tokio::runtime::Handle;
    use tokio::sync::OnceCell;
    use tokio::time::sleep;
    use uuid::Uuid;

    const MYSQL_IMAGE: &str = "mysql";
    const MYSQL_TAG: &str = "8.4";
    const MYSQL_PORT: u16 = 3306;
    const MYSQL_ROOT_PASSWORD: &str = "test-password";

    static HARNESS: OnceCell<Arc<MySqlTestHarness>> = OnceCell::const_new();

    struct MySqlTestHarness {
        _container: ContainerAsync<GenericImage>,
        base_url: String,
        server_pool: MySqlPool,
    }

    impl MySqlTestHarness {
        async fn instance() -> Result<Arc<Self>> {
            HARNESS
                .get_or_try_init(|| async {
                    let harness = Self::create().await?;
                    Ok::<_, anyhow::Error>(harness)
                })
                .await
                .map(Arc::clone)
        }

        async fn create() -> Result<Arc<Self>> {
            let image = GenericImage::new(MYSQL_IMAGE, MYSQL_TAG)
                .with_wait_for(WaitFor::message_on_stderr("ready for connections"))
                .with_exposed_port(MYSQL_PORT.tcp())
                .with_env_var("MYSQL_ROOT_PASSWORD", MYSQL_ROOT_PASSWORD)
                .with_env_var("MYSQL_ROOT_HOST", "%");

            let container = image.start().await?;
            let port = container
                .get_host_port_ipv4(MYSQL_PORT.tcp())
                .await
                .expect("mysql port available");
            let base_url = format!("mysql://root:{MYSQL_ROOT_PASSWORD}@127.0.0.1:{port}");
            let server_pool = connect_with_retry(&(base_url.clone() + "/mysql"), 20, 20).await?;

            Ok(Arc::new(Self {
                _container: container,
                base_url,
                server_pool,
            }))
        }

        fn base_url(&self) -> &str {
            &self.base_url
        }

        async fn create_database(&self, name: &str) -> Result<()> {
            let stmt = format!(
                "CREATE DATABASE `{}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
                name
            );
            query(&stmt).execute(&self.server_pool).await?;
            Ok(())
        }

        async fn drop_database(&self, name: &str) -> Result<()> {
            let stmt = format!("DROP DATABASE IF EXISTS `{}`", name);
            query(&stmt).execute(&self.server_pool).await?;
            Ok(())
        }
    }

    async fn connect_with_retry(
        database_url: &str,
        max_connections: u32,
        attempts: usize,
    ) -> Result<MySqlPool> {
        let mut current = 0;
        loop {
            match MySqlPoolOptions::new()
                .max_connections(max_connections)
                .acquire_timeout(Duration::from_secs(10))
                .connect(database_url)
                .await
            {
                Ok(pool) => {
                    query("SELECT 1").execute(&pool).await?;
                    return Ok(pool);
                }
                Err(err) if current + 1 < attempts => {
                    current += 1;
                    let backoff = Duration::from_millis(200 + 200 * current as u64);
                    eprintln!(
                        "waiting for mysql: {err}; retrying in {}ms",
                        backoff.as_millis()
                    );
                    sleep(backoff).await;
                }
                Err(err) => return Err(err.into()),
            }
        }
    }

    pub(crate) struct TestSchema {
        pool: MySqlPool,
        db_name: String,
        harness: Arc<MySqlTestHarness>,
    }

    impl TestSchema {
        pub(crate) async fn new() -> Result<Self> {
            let harness = MySqlTestHarness::instance().await?;
            let db_name = format!("test_{}", Uuid::now_v7());
            harness.create_database(&db_name).await?;

            let db_url = format!("{}/{}", harness.base_url(), db_name);
            let pool = connect_with_retry(&db_url, 10, 20).await?;

            sqlx::migrate!("./migrations").run(&pool).await?;

            Ok(Self {
                pool,
                db_name,
                harness,
            })
        }

        pub(crate) fn pool(&self) -> &MySqlPool {
            &self.pool
        }
    }

    impl Drop for TestSchema {
        fn drop(&mut self) {
            let db_name = self.db_name.clone();
            let harness = self.harness.clone();
            let pool = self.pool.clone();

            if let Ok(handle) = Handle::try_current() {
                handle.spawn(async move {
                    pool.close().await;
                    let _ = harness.drop_database(&db_name).await;
                });
            }
        }
    }
}
