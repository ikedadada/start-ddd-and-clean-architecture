package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.Optional;

import io.github.ikedadada.backend_java.domain.model.Todo;

public interface CreateTodoUsecase {
    Todo handle(String title, Optional<String> description);
}
