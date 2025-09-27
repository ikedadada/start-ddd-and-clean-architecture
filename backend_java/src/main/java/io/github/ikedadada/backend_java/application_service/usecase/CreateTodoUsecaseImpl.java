package io.github.ikedadada.backend_java.application_service.usecase;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class CreateTodoUsecaseImpl implements CreateTodoUsecase {
    @Autowired
    private TodoRepository todoRepository;

    public CreateTodoUsecaseImpl(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    @Override
    public Todo handle(String title, String description) {
        Todo todo = new Todo(title, description);
        todoRepository.save(todo);
        return todo;
    }
}