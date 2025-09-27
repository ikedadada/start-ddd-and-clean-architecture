package io.github.ikedadada.backend_java.application_service.usecase;

import io.github.ikedadada.backend_java.domain.model.Todo;

public interface CreateTodoUsecase {
    Todo handle(String title, String description);
}
