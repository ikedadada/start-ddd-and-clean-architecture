package io.github.ikedadada.backend_java.domain.repository;

public sealed class RepositoryException extends RuntimeException
        permits RepositoryException.TodoNotFound {
    public RepositoryException(String message) {
        super(message);
    }

    public static final class TodoNotFound extends RepositoryException {
        public TodoNotFound(String id) {
            super("Todo not found. id=" + id);
        }
    }

}
