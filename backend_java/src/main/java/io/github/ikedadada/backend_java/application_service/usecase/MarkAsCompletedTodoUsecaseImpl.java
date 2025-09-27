package io.github.ikedadada.backend_java.application_service.usecase;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;
import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

public class MarkAsCompletedTodoUsecaseImpl implements MarkAsCompletedTodoUsecase {
    private final TodoRepository todoRepository;
    private final TransactionService transactionService;

    public MarkAsCompletedTodoUsecaseImpl(TodoRepository todoRepository, TransactionService transactionService) {
        this.todoRepository = todoRepository;
        this.transactionService = transactionService;
    }

    @Override
    public Todo handle(java.util.UUID id) {
        return transactionService.run(() -> {
            Todo todo = todoRepository.findById(id);
            todo.markAsCompleted();
            todoRepository.save(todo);
            return todo;
        });
    }
}
