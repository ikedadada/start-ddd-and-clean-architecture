package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.Optional;
import java.util.UUID;

import io.github.ikedadada.backend_java.domain.model.Todo;

public interface UpdateTodoUsecase {
    Todo handle(UUID id, String title, Optional<String> description);
}
