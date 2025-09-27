package io.github.ikedadada.backend_java.application_service.usecase;

import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;
import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class MarkAsNotCompletedTodoUsecaseImpl implements MarkAsNotCompletedTodoUsecase {
    private final TodoRepository todoRepository;
    private final TransactionService transactionService;

    public MarkAsNotCompletedTodoUsecaseImpl(TodoRepository todoRepository, TransactionService transactionService) {
        this.todoRepository = todoRepository;
        this.transactionService = transactionService;
    }

    @Override
    public Todo handle(java.util.UUID id) {
        return transactionService.run(() -> {
            Todo todo = todoRepository.findById(id);
            todo.markAsNotCompleted();
            todoRepository.save(todo);
            return todo;
        });
    }

}
