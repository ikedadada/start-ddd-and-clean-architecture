package io.github.ikedadada.backend_java.application_service.usecase;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;
import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class MarkAsCompletedTodoUsecaseImpl implements MarkAsCompletedTodoUsecase {
    @Autowired
    private TodoRepository todoRepository;
    @Autowired
    private TransactionService transactionService;

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
