package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;
import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class DeleteTodoUsecaseImpl implements DeleteTodoUsecase {
    @Autowired
    private TodoRepository todoRepository;
    @Autowired
    private TransactionService transactionService;

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
