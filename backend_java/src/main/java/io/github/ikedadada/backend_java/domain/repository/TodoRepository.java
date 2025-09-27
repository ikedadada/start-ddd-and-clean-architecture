package io.github.ikedadada.backend_java.domain.repository;

import java.util.ArrayList;
import java.util.UUID;

import io.github.ikedadada.backend_java.domain.model.Todo;

public interface TodoRepository {
    ArrayList<Todo> findAll();

    Todo findById(UUID id) throws RepositoryException.TodoNotFound;

    void save(Todo todo);

    void delete(UUID id);
}
