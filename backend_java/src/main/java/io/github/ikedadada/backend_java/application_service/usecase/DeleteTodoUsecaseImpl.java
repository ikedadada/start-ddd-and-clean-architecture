package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.UUID;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;
import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

public class DeleteTodoUsecaseImpl implements DeleteTodoUsecase {
    private final TodoRepository todoRepository;
    private final TransactionService transactionService;

    public DeleteTodoUsecaseImpl(TodoRepository todoRepository, TransactionService transactionService) {
        this.todoRepository = todoRepository;
        this.transactionService = transactionService;
    }

    @Override
    public void handle(UUID id) {
        transactionService.run(() -> {
            Todo todo = todoRepository.findById(id);
            todoRepository.delete(todo);
        });
    }
}
