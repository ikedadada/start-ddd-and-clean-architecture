package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.UUID;

public interface DeleteTodoUsecase {
    void handle(UUID id);
}
