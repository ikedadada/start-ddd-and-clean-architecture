package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class GetAllTodosUsecaseImpl implements GetAllTodosUsecase {
    @Autowired
    private TodoRepository todoRepository;

    public GetAllTodosUsecaseImpl(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    @Override
    public ArrayList<Todo> handle() {
        return todoRepository.findAll();
    }

}
