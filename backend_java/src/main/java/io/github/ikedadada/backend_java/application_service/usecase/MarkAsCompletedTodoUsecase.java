package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.UUID;

import io.github.ikedadada.backend_java.domain.model.Todo;

public interface MarkAsCompletedTodoUsecase {
    Todo handle(UUID id);
}
