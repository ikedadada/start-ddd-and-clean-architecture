use std::sync::Arc;

use axum::routing::{get, put};
use axum::Router;

use crate::application::service::transaction_service::TransactionService;
use crate::presentation::handler::create_todo_handler::CreateTodoHandler;
use crate::presentation::handler::delete_todo_handler::DeleteTodoHandler;
use crate::presentation::handler::get_all_todos_handler::GetAllTodosHandler;
use crate::presentation::handler::get_todo_handler::GetTodoHandler;
use crate::presentation::handler::mark_as_completed_todo_handler::MarkAsCompletedTodoHandler;
use crate::presentation::handler::mark_as_uncompleted_todo_handler::MarkAsUncompletedTodoHandler;
use crate::presentation::handler::update_todo_handler::UpdateTodoHandler;

#[derive(Clone)]
pub struct TodoRouterContainer<TS>
where
    TS: TransactionService,
{
    pub create_todo: Arc<CreateTodoHandler>,
    pub delete_todo: Arc<DeleteTodoHandler<TS>>,
    pub get_all_todos: Arc<GetAllTodosHandler>,
    pub get_todo: Arc<GetTodoHandler>,
    pub mark_as_completed_todo: Arc<MarkAsCompletedTodoHandler<TS>>,
    pub mark_as_uncompleted_todo: Arc<MarkAsUncompletedTodoHandler<TS>>,
    pub update_todo: Arc<UpdateTodoHandler<TS>>,
}

impl<TS> TodoRouterContainer<TS>
where
    TS: TransactionService,
{
    pub fn new(
        create_todo: Arc<CreateTodoHandler>,
        delete_todo: Arc<DeleteTodoHandler<TS>>,
        get_all_todos: Arc<GetAllTodosHandler>,
        get_todo: Arc<GetTodoHandler>,
        mark_as_completed_todo: Arc<MarkAsCompletedTodoHandler<TS>>,
        mark_as_uncompleted_todo: Arc<MarkAsUncompletedTodoHandler<TS>>,
        update_todo: Arc<UpdateTodoHandler<TS>>,
    ) -> Self {
        Self {
            create_todo,
            delete_todo,
            get_all_todos,
            get_todo,
            mark_as_completed_todo,
            mark_as_uncompleted_todo,
            update_todo,
        }
    }
}

pub fn router<TS>(container: TodoRouterContainer<TS>) -> Router
where
    TS: TransactionService + 'static,
{
    let TodoRouterContainer {
        create_todo,
        delete_todo,
        get_all_todos,
        get_todo,
        mark_as_completed_todo,
        mark_as_uncompleted_todo,
        update_todo,
    } = container;

    Router::new()
        .route(
            "/todos",
            get({
                let handler = get_all_todos.clone();
                move || {
                    let handler = handler.clone();
                    async move { handler.handle().await }
                }
            })
            .post({
                let handler = create_todo.clone();
                move |payload| {
                    let handler = handler.clone();
                    async move { handler.handle(payload).await }
                }
            }),
        )
        .route(
            "/todos/:id",
            get({
                let handler = get_todo.clone();
                move |path| {
                    let handler = handler.clone();
                    async move { handler.handle(path).await }
                }
            })
            .put({
                let handler = update_todo.clone();
                move |path, payload| {
                    let handler = handler.clone();
                    async move { handler.handle(path, payload).await }
                }
            })
            .delete({
                let handler = delete_todo.clone();
                move |path| {
                    let handler = handler.clone();
                    async move { handler.handle(path).await }
                }
            }),
        )
        .route(
            "/todos/:id/complete",
            put({
                let handler = mark_as_completed_todo.clone();
                move |path| {
                    let handler = handler.clone();
                    async move { handler.handle(path).await }
                }
            }),
        )
        .route(
            "/todos/:id/uncomplete",
            put({
                let handler = mark_as_uncompleted_todo.clone();
                move |path| {
                    let handler = handler.clone();
                    async move { handler.handle(path).await }
                }
            }),
        )
}
