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
    private Optional<String> description;
    private boolean completed;

    private Todo(UUID id, String title, Optional<String> description, boolean completed) {
        this.id = Objects.requireNonNull(id);
        this.title = Objects.requireNonNull(title);
        this.description = description;
        this.completed = completed;
    }

    public Todo(String title, Optional<String> description) {
        this(GENERATOR.generate(), title, description, false);
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public Optional<String> getDescription() {
        return description;
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

    public void markAsNotCompleted() {
        if (!completed) {
            throw new DomainException.TodoNotCompleted(this);
        }
        this.completed = false;
    }

    public void update(String title, Optional<String> description) {
        this.title = Objects.requireNonNull(title);
        this.description = description;
    }

    public static final class DTO {
        public UUID id;
        public String title;
        @Nullable
        public String description;
        public boolean completed;

        public DTO(UUID id, String title, @Nullable String description, boolean completed) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.completed = completed;
        }

        public Todo toDomain() {
            Todo todo = new Todo(id, title, Optional.ofNullable(description), completed);
            return todo;
        }
    }
}
