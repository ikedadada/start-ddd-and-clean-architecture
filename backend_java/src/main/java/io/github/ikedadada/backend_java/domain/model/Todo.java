package io.github.ikedadada.backend_java.domain.model;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.impl.TimeBasedEpochGenerator;

import jakarta.annotation.Nullable;

public class Todo {
    private static final TimeBasedEpochGenerator GENERATOR;
    static {
        GENERATOR = Generators.timeBasedEpochGenerator();
    }
    private UUID id;
    private String title;
    @Nullable
    private String description;
    private boolean completed;

    private Todo(UUID id, String title, String description, boolean completed) {
        this.id = Objects.requireNonNull(id);
        this.title = Objects.requireNonNull(title);
        this.description = description;
        this.completed = completed;
    }

    public Todo(String title, String description) {
        this(GENERATOR.generate(), title, description, false);
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public Optional<String> getDescription() {
        return Optional.ofNullable(description);
    }

    public boolean isCompleted() {
        return completed;
    }

    public void markAsCompleted() {
        if (completed) {
            throw new DomainException.TodoAlreadyCompleted(this);
        }
        this.completed = true;
    }

    public void markAsUndone() {
        if (!completed) {
            throw new DomainException.TodoNotCompleted(this);
        }
        this.completed = false;
    }

    public void update(String title, @Nullable String description) {
        this.title = Objects.requireNonNull(title);
        this.description = description;
    }

    public static final class DTO {
        public UUID id;
        public String title;
        @Nullable
        public String description;
        public boolean completed;

        public DTO(Todo todo) {
            this.id = todo.getId();
            this.title = todo.getTitle();
            this.description = todo.getDescription().orElse(null);
            this.completed = todo.isCompleted();
        }

        public Todo toDomain() {
            Todo todo = new Todo(id, title, description, completed);
            return todo;
        }
    }
}
