mod application;
mod domain;
mod infrastructure;
mod presentation;

use std::env;
use std::net::SocketAddr;
use std::sync::Arc;

use axum::routing::get;
use axum::Router;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;
use tracing::info;

use crate::application::usecase::create_todo_usecase::CreateTodoUsecase;
use crate::application::usecase::delete_todo_usecase::DeleteTodoUsecase;
use crate::application::usecase::get_all_todos_usecase::GetAllTodosUsecase;
use crate::application::usecase::get_todo_usecase::GetTodoUsecase;
use crate::application::usecase::mark_as_completed_todo_usecase::MarkAsCompletedTodoUsecase;
use crate::application::usecase::mark_as_uncompleted_todo_usecase::MarkAsUncompletedTodoUsecase;
use crate::application::usecase::update_todo_usecase::UpdateTodoUsecase;
use crate::domain::repository::todo_repository::TodoRepository;
use crate::infrastructure::repository::context_provider::ContextProviderImpl;
use crate::infrastructure::repository::todo_repository::TodoRepositoryImpl;
use crate::infrastructure::service::transaction_service::TransactionServiceImpl;
use crate::presentation::handler::create_todo_handler::CreateTodoHandler;
use crate::presentation::handler::delete_todo_handler::DeleteTodoHandler;
use crate::presentation::handler::get_all_todos_handler::GetAllTodosHandler;
use crate::presentation::handler::get_todo_handler::GetTodoHandler;
use crate::presentation::handler::mark_as_completed_todo_handler::MarkAsCompletedTodoHandler;
use crate::presentation::handler::mark_as_uncompleted_todo_handler::MarkAsUncompletedTodoHandler;
use crate::presentation::handler::update_todo_handler::UpdateTodoHandler;
use crate::presentation::router::todo_router::{router as todo_router, TodoRouterContainer};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let database_url =
        env::var("DATABASE_URL").expect("DATABASE_URL environment variable is required");
    let pool = build_pool(&database_url).await?;

    let context_provider = Arc::new(ContextProviderImpl::new(pool.clone()));

    let todo_repository_impl = Arc::new(TodoRepositoryImpl::new(context_provider.clone()));
    let todo_repository: Arc<dyn TodoRepository> = todo_repository_impl.clone();

    let transaction_service = Arc::new(TransactionServiceImpl::new(context_provider.clone()));

    // Application layer usecases
    let create_todo_usecase = Arc::new(CreateTodoUsecase::new(todo_repository.clone()));
    let delete_todo_usecase = Arc::new(DeleteTodoUsecase::new(
        todo_repository.clone(),
        transaction_service.clone(),
    ));
    let get_all_todos_usecase = Arc::new(GetAllTodosUsecase::new(todo_repository.clone()));
    let get_todo_usecase = Arc::new(GetTodoUsecase::new(todo_repository.clone()));
    let mark_as_completed_usecase = Arc::new(MarkAsCompletedTodoUsecase::new(
        todo_repository.clone(),
        transaction_service.clone(),
    ));
    let mark_as_uncompleted_usecase = Arc::new(MarkAsUncompletedTodoUsecase::new(
        todo_repository.clone(),
        transaction_service.clone(),
    ));
    let update_todo_usecase = Arc::new(UpdateTodoUsecase::new(
        todo_repository.clone(),
        transaction_service.clone(),
    ));

    // Presentation layer handlers
    let create_todo_handler = Arc::new(CreateTodoHandler::new(create_todo_usecase));
    let delete_todo_handler = Arc::new(DeleteTodoHandler::new(delete_todo_usecase));
    let get_all_todos_handler = Arc::new(GetAllTodosHandler::new(get_all_todos_usecase));
    let get_todo_handler = Arc::new(GetTodoHandler::new(get_todo_usecase));
    let mark_as_completed_handler =
        Arc::new(MarkAsCompletedTodoHandler::new(mark_as_completed_usecase));
    let mark_as_uncompleted_handler = Arc::new(MarkAsUncompletedTodoHandler::new(
        mark_as_uncompleted_usecase,
    ));
    let update_todo_handler = Arc::new(UpdateTodoHandler::new(update_todo_usecase));

    let container = TodoRouterContainer::new(
        create_todo_handler,
        delete_todo_handler,
        get_all_todos_handler,
        get_todo_handler,
        mark_as_completed_handler,
        mark_as_uncompleted_handler,
        update_todo_handler,
    );

    let app = Router::new()
        .merge(todo_router(container))
        .route("/healthcheck", get(|| async { "OK" }))
        .layer(TraceLayer::new_for_http());

    let port = env::var("PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(3000u16);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await?;
    info!("listening on {}", addr);

    axum::serve(listener, app).await?;
    Ok(())
}

async fn build_pool(database_url: &str) -> Result<MySqlPool, sqlx::Error> {
    MySqlPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
}
