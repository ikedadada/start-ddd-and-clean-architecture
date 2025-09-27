package io.github.ikedadada.backend_java.infrastructure.repository;

import java.util.ArrayList;

import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.RepositoryException;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class TodoRepositoryImpl implements TodoRepository {

    @Override
    public ArrayList<Todo> findAll() {
        ArrayList<Todo> todos = new ArrayList<>();
        todos.add(new Todo("title1", "description1"));
        todos.add(new Todo("title2", "description2"));
        todos.add(new Todo("title3", "description3"));
        return todos;
    }

    @Override
    public Todo findById(java.util.UUID id) throws RepositoryException.TodoNotFound {
        return new Todo("title", "description");
    }

    @Override
    public void save(io.github.ikedadada.backend_java.domain.model.Todo todo) {
        // TODO Auto-generated method stub

    }

    @Override
    public void delete(io.github.ikedadada.backend_java.domain.model.Todo todo) {
        // TODO Auto-generated method stub
    }
}
