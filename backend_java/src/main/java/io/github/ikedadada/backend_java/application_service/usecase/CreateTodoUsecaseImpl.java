package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.Optional;

import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class CreateTodoUsecaseImpl implements CreateTodoUsecase {
    private final TodoRepository todoRepository;

    public CreateTodoUsecaseImpl(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    @Override
    public Todo handle(String title, Optional<String> description) {
        Todo todo = new Todo(title, description);
        todoRepository.save(todo);
        return todo;
    }
}
