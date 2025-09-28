package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;
import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class UpdateTodoUsecaseImpl implements UpdateTodoUsecase {
    private final TodoRepository todoRepository;
    private final TransactionService transactionService;

    public UpdateTodoUsecaseImpl(TodoRepository todoRepository, TransactionService transactionService) {
        this.todoRepository = todoRepository;
        this.transactionService = transactionService;
    }

    @Override
    public Todo handle(UUID id, String title, Optional<String> description) {
        return transactionService.run(() -> {
            Todo todo = todoRepository.findById(id);
            todo.update(title, description);
            todoRepository.save(todo);
            return todo;
        });
    }

}
