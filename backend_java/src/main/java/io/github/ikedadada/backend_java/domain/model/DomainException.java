package io.github.ikedadada.backend_java.domain.model;

public sealed class DomainException extends RuntimeException
        permits DomainException.TodoAlreadyCompleted, DomainException.TodoNotCompleted {
    public DomainException(String message) {
        super(message);
    }

    public static final class TodoAlreadyCompleted extends DomainException {
        public TodoAlreadyCompleted(Todo todo) {
            super("This todo is already completed. id=" + todo.getId());
        }
    }

    public static final class TodoNotCompleted extends DomainException {
        public TodoNotCompleted(Todo todo) {
            super("This todo is not completed yet. id=" + todo.getId());
        }
    }
}
