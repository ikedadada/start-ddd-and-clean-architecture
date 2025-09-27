package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.UUID;

import io.github.ikedadada.backend_java.domain.model.Todo;
import jakarta.annotation.Nullable;

public interface UpdateTodoUsecase {
    Todo handle(UUID id, String title, @Nullable String description);
}
