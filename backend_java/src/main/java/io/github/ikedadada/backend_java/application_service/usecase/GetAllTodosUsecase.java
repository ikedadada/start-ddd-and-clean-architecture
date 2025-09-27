package io.github.ikedadada.backend_java.application_service.usecase;

import java.util.ArrayList;

import io.github.ikedadada.backend_java.domain.model.Todo;

public interface GetAllTodosUsecase {
    ArrayList<Todo> handle();
}
