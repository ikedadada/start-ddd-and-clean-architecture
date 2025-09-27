package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class GetTodoUsecaseImpl implements GetTodoUsecase {
    @Autowired
    private TodoRepository todoRepository;

    public GetTodoUsecaseImpl(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    @Override
    public Todo handle(UUID id) {
        return todoRepository.findById(id);
    }

}
