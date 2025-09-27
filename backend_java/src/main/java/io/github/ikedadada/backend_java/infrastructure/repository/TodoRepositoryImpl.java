package io.github.ikedadada.backend_java.infrastructure.repository;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.RepositoryException;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Component
public class TodoRepositoryImpl implements TodoRepository {
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public ArrayList<Todo> findAll() {
        var sql = "SELECT id, title, description, completed FROM todos";
        var obj = jdbcTemplate.query(sql, (rs, rowNum) -> {
            var dto = new Todo.DTO(
                    rs.getObject("id", java.util.UUID.class),
                    rs.getString("title"),
                    rs.getString("description"),
                    rs.getBoolean("completed"));

            return dto.toDomain();
        });
        return new ArrayList<>(obj);
    }

    @Override
    public Todo findById(java.util.UUID id) throws RepositoryException.TodoNotFound {
        var sql = "SELECT id, title, description, completed FROM todos WHERE id = :id";
        var param = new java.util.HashMap<String, Object>();
        param.put("id", id.toString());
        var obj = jdbcTemplate.query(sql, param, (rs, rowNum) -> {
            var dto = new Todo.DTO(
                    rs.getObject("id", java.util.UUID.class),
                    rs.getString("title"),
                    rs.getString("description"),
                    rs.getBoolean("completed"));

            return dto.toDomain();
        });
        if (obj.isEmpty()) {
            throw new RepositoryException.TodoNotFound(id.toString());
        }
        return obj.get(0);
    }

    @Override
    public void save(io.github.ikedadada.backend_java.domain.model.Todo todo) {
        var sql = "INSERT INTO todos (id, title, description, completed) VALUES (:id, :title, :description, :completed) "
                + "ON DUPLICATE KEY UPDATE title = :title, description = :description, completed = :completed";
        var param = new java.util.HashMap<String, Object>();
        param.put("id", todo.getId().toString());
        param.put("title", todo.getTitle());
        param.put("description", todo.getDescription().orElse(null));
        param.put("completed", todo.isCompleted());
        jdbcTemplate.update(sql, param);
    }

    @Override
    public void delete(io.github.ikedadada.backend_java.domain.model.Todo todo) {
        var sql = "DELETE FROM todos WHERE id = :id";
        var param = new java.util.HashMap<String, Object>();
        param.put("id", todo.getId().toString());
        jdbcTemplate.update(sql, param);
    }
}
