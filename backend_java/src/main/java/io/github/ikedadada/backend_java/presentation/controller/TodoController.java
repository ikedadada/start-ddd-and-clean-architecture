package io.github.ikedadada.backend_java.presentation.controller;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.github.ikedadada.backend_java.application_service.usecase.CreateTodoUsecase;
import io.github.ikedadada.backend_java.application_service.usecase.DeleteTodoUsecase;
import io.github.ikedadada.backend_java.application_service.usecase.GetAllTodosUsecase;
import io.github.ikedadada.backend_java.application_service.usecase.GetTodoUsecase;
import io.github.ikedadada.backend_java.application_service.usecase.MarkAsCompletedTodoUsecase;
import io.github.ikedadada.backend_java.application_service.usecase.MarkAsNotCompletedTodoUsecase;
import io.github.ikedadada.backend_java.application_service.usecase.UpdateTodoUsecase;
import io.github.ikedadada.backend_java.domain.model.DomainException;
import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.RepositoryException;
import io.github.ikedadada.backend_java.presentation.middleware.HttpException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@RestController
public class TodoController {
    @Autowired
    private CreateTodoUsecase createTodoUsecase;
    @Autowired
    private GetAllTodosUsecase getAllTodosUsecase;
    @Autowired
    private GetTodoUsecase getTodoUsecase;
    @Autowired
    private UpdateTodoUsecase updateTodoUsecase;
    @Autowired
    private MarkAsCompletedTodoUsecase markAsCompletedTodoUsecase;
    @Autowired
    private MarkAsNotCompletedTodoUsecase markAsNotCompletedTodoUsecase;
    @Autowired
    private DeleteTodoUsecase deleteTodoUsecase;

    private static String resolveDescription(Optional<String> description) {
        return description != null ? description.orElse(null) : null;
    }

    private static class CreateTodoRequest {
        @NotNull
        public String title;
        public Optional<String> description;
    }

    @SuppressWarnings("unused")
    private static class CreateTodoResponse {
        public String id;
        public String title;
        public Optional<String> description;
        public boolean completed;

        public CreateTodoResponse(Todo todo) {
            this.id = todo.getId().toString();
            this.title = todo.getTitle();
            this.description = todo.getDescription();
            this.completed = todo.isCompleted();
        }
    }

    @PostMapping(value = "/todos", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @ResponseBody
    public CreateTodoResponse createTodo(@RequestBody @Valid CreateTodoRequest request) {
        Todo todo = createTodoUsecase.handle(request.title, resolveDescription(request.description));
        return new CreateTodoResponse(todo);
    }

    private static class GetAllTodosResponse {
        @SuppressWarnings("unused")
        private static class GetAllTodosTodoResponse {
            public String id;
            public String title;
            public Optional<String> description;
            public boolean completed;

            public GetAllTodosTodoResponse(Todo todo) {
                this.id = todo.getId().toString();
                this.title = todo.getTitle();
                this.description = todo.getDescription();
                this.completed = todo.isCompleted();
            }
        }

        public ArrayList<GetAllTodosTodoResponse> todos;

        public GetAllTodosResponse(ArrayList<Todo> todos) {
            this.todos = new ArrayList<>();
            for (Todo todo : todos) {
                this.todos.add(new GetAllTodosTodoResponse(todo));
            }
        }
    }

    @GetMapping(value = "/todos", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public GetAllTodosResponse getTodos() {
        ArrayList<Todo> todos = getAllTodosUsecase.handle();
        return new GetAllTodosResponse(todos);
    }

    @SuppressWarnings("unused")
    private static class GetTodoResponse {
        public String id;
        public String title;
        public Optional<String> description;
        public boolean completed;

        public GetTodoResponse(Todo todo) {
            this.id = todo.getId().toString();
            this.title = todo.getTitle();
            this.description = todo.getDescription();
            this.completed = todo.isCompleted();
        }
    }

    @GetMapping(value = "/todos/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public GetTodoResponse getTodo(@PathVariable("id") @Valid UUID id) throws HttpException.NotFound {
        try {
            Todo todo = getTodoUsecase.handle(id);
            return new GetTodoResponse(todo);
        } catch (RepositoryException.TodoNotFound e) {
            throw new HttpException.NotFound(e.getMessage());
        }
    }

    private static class UpdateTodoRequest {
        @NotNull
        public String title;
        public Optional<String> description;
    }

    @SuppressWarnings("unused")
    private static class UpdateTodoResponse {
        public String id;
        public String title;
        public Optional<String> description;
        public boolean completed;

        public UpdateTodoResponse(Todo todo) {
            this.id = todo.getId().toString();
            this.title = todo.getTitle();
            this.description = todo.getDescription();
            this.completed = todo.isCompleted();
        }
    }

    @PutMapping(value = "/todos/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public UpdateTodoResponse updateTodo(@PathVariable("id") @Valid UUID id,
            @RequestBody @Valid UpdateTodoRequest request)
            throws HttpException.NotFound {
        try {
            Todo todo = updateTodoUsecase.handle(id, request.title, resolveDescription(request.description));
            return new UpdateTodoResponse(todo);
        } catch (RepositoryException.TodoNotFound e) {
            throw new HttpException.NotFound(e.getMessage());
        }
    }

    @SuppressWarnings("unused")
    private static class MarkAsCompletedResponse {
        public String id;
        public String title;
        public Optional<String> description;
        public boolean completed;

        public MarkAsCompletedResponse(Todo todo) {
            this.id = todo.getId().toString();
            this.title = todo.getTitle();
            this.description = todo.getDescription();
            this.completed = todo.isCompleted();
        }
    }

    @PutMapping(value = "/todos/{id}/complete", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public MarkAsCompletedResponse markAsCompleted(@PathVariable("id") @Valid UUID id)
            throws HttpException.NotFound, HttpException.Conflict {
        try {
            Todo todo = markAsCompletedTodoUsecase.handle(id);
            return new MarkAsCompletedResponse(todo);
        } catch (DomainException.TodoAlreadyCompleted e) {
            throw new HttpException.Conflict(e.getMessage());
        } catch (RepositoryException.TodoNotFound e) {
            throw new HttpException.NotFound(e.getMessage());
        }
    }

    @SuppressWarnings("unused")
    private static class MarkAsNotCompletedResponse {
        public String id;
        public String title;
        public Optional<String> description;
        public boolean completed;

        public MarkAsNotCompletedResponse(Todo todo) {
            this.id = todo.getId().toString();
            this.title = todo.getTitle();
            this.description = todo.getDescription();
            this.completed = todo.isCompleted();
        }
    }

    @PutMapping(value = "/todos/{id}/uncomplete", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public MarkAsNotCompletedResponse markAsNotCompleted(@PathVariable("id") @Valid UUID id)
            throws HttpException.NotFound, HttpException.Conflict {
        try {
            Todo todo = markAsNotCompletedTodoUsecase.handle(id);
            return new MarkAsNotCompletedResponse(todo);
        } catch (DomainException.TodoNotCompleted e) {
            throw new HttpException.Conflict(e.getMessage());
        } catch (RepositoryException.TodoNotFound e) {
            throw new HttpException.NotFound(e.getMessage());
        }
    }

    @DeleteMapping(value = "/todos/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable("id") @Valid UUID id) throws HttpException.NotFound {
        try {
            deleteTodoUsecase.handle(id);
            return ResponseEntity.noContent().build();
        } catch (RepositoryException.TodoNotFound e) {
            throw new HttpException.NotFound(e.getMessage());
        }
    }
}
