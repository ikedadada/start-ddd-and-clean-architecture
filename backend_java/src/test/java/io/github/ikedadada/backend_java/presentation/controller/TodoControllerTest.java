package io.github.ikedadada.backend_java.presentation.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

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
import io.github.ikedadada.backend_java.presentation.middleware.ExceptionHandlerMiddleware;

@WebMvcTest(controllers = TodoController.class)
@Import({ ExceptionHandlerMiddleware.class, TodoControllerTest.MockConfig.class })
class TodoControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

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

        private static Todo todo(UUID id, String title, String description, boolean completed) {
                Todo.DTO dto = new Todo.DTO(id, title, description, completed);
                return dto.toDomain();
        }

        @Test
        void createTodoReturnsCreatedTodo() throws Exception {
                UUID id = UUID.randomUUID();
                Todo created = todo(id, "new todo", "write presentation tests", false);
                when(createTodoUsecase.handle(eq("new todo"), eq(Optional.of("write presentation tests"))))
                                .thenReturn(created);

                var request = new java.util.HashMap<String, Object>();
                request.put("title", "new todo");
                request.put("description", "write presentation tests");

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/todos")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isCreated())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
                                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.id")
                                                .value(id.toString()))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.title")
                                                .value("new todo"))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.description")
                                                .value("write presentation tests"))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.completed")
                                                .value(false));

                verify(createTodoUsecase).handle("new todo", Optional.of("write presentation tests"));
        }

        @Test
        void createTodoWithoutTitleReturnsBadRequest() throws Exception {
                var request = new java.util.HashMap<String, Object>();
                request.put("description", "missing title");

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/todos")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isBadRequest())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.status")
                                                .value(400))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.message")
                                                .value(containsString("Bad Request")));
        }

        @Test
        void getTodosReturnsTodosFromUsecase() throws Exception {
                Todo first = todo(UUID.randomUUID(), "first", "desc1", false);
                Todo second = todo(UUID.randomUUID(), "second", "desc2", true);
                ArrayList<Todo> todos = new ArrayList<>(List.of(first, second));
                when(getAllTodosUsecase.handle()).thenReturn(todos);

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/todos")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isOk())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath(
                                                "$.todos",
                                                hasSize(2)))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath(
                                                "$.todos[*].id",
                                                containsInAnyOrder(first.getId().toString(),
                                                                second.getId().toString())));

                verify(getAllTodosUsecase).handle();
        }

        @Test
        void getTodoReturnsTodoWhenFound() throws Exception {
                UUID id = UUID.randomUUID();
                Todo todo = todo(id, "read", "chapter", false);
                when(getTodoUsecase.handle(id)).thenReturn(todo);

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .get("/todos/{id}", id)
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isOk())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.id")
                                                .value(id.toString()))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.title")
                                                .value("read"));
        }

        @Test
        void getTodoReturnsNotFoundWhenRepositoryThrows() throws Exception {
                UUID id = UUID.randomUUID();
                when(getTodoUsecase.handle(id)).thenThrow(new RepositoryException.TodoNotFound(id.toString()));

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .get("/todos/{id}", id)
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isNotFound())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.status")
                                                .value(404))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.message")
                                                .value(containsString(id.toString())));
        }

        @Test
        void updateTodoReturnsUpdatedTodo() throws Exception {
                UUID id = UUID.randomUUID();
                Todo updated = todo(id, "updated", "new description", true);
                when(updateTodoUsecase.handle(eq(id), eq("updated"), eq(Optional.of("new description"))))
                                .thenReturn(updated);

                var request = new java.util.HashMap<String, Object>();
                request.put("title", "updated");
                request.put("description", "new description");

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .put("/todos/{id}", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isOk())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.id")
                                                .value(id.toString()))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.completed")
                                                .value(true));
        }

        @Test
        void updateTodoReturnsNotFoundWhenMissing() throws Exception {
                UUID id = UUID.randomUUID();
                when(updateTodoUsecase.handle(eq(id), eq("title"), any()))
                                .thenThrow(new RepositoryException.TodoNotFound(id.toString()));

                var request = new java.util.HashMap<String, Object>();
                request.put("title", "title");

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .put("/todos/{id}", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isNotFound())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.status")
                                                .value(404));
        }

        @Test
        void markAsCompletedReturnsConflictWhenAlreadyCompleted() throws Exception {
                UUID id = UUID.randomUUID();
                Todo existing = todo(id, "already", "completed", true);
                when(markAsCompletedTodoUsecase.handle(id))
                                .thenThrow(new DomainException.TodoAlreadyCompleted(existing));

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .put("/todos/{id}/complete", id))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isConflict())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.status")
                                                .value(409));
        }

        @Test
        void markAsNotCompletedReturnsConflictWhenNotCompleted() throws Exception {
                UUID id = UUID.randomUUID();
                Todo existing = todo(id, "not completed", "", false);
                when(markAsNotCompletedTodoUsecase.handle(id))
                                .thenThrow(new DomainException.TodoNotCompleted(existing));

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .put("/todos/{id}/uncomplete", id))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isConflict())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.status")
                                                .value(409));
        }

        @Test
        void deleteTodoReturnsNoContent() throws Exception {
                UUID id = UUID.randomUUID();

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .delete("/todos/{id}", id))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isNoContent());

                verify(deleteTodoUsecase).handle(id);
        }

        @Test
        void deleteTodoReturnsNotFoundWhenRepositoryThrows() throws Exception {
                UUID id = UUID.randomUUID();
                doThrow(new RepositoryException.TodoNotFound(id.toString())).when(deleteTodoUsecase).handle(id);

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .delete("/todos/{id}", id))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isNotFound())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.status")
                                                .value(404));
        }

        @Test
        void unhandledExceptionReturnsInternalServerError() throws Exception {
                UUID id = UUID.randomUUID();
                when(getTodoUsecase.handle(id)).thenThrow(new RuntimeException("boom"));

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .get("/todos/{id}", id)
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                                                .isInternalServerError())
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.status")
                                                .value(500))
                                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                                .jsonPath("$.message")
                                                .value("Internal Server Error"));
        }

        @TestConfiguration
        static class MockConfig {
                @Bean
                CreateTodoUsecase createTodoUsecase() {
                        return Mockito.mock(CreateTodoUsecase.class);
                }

                @Bean
                GetAllTodosUsecase getAllTodosUsecase() {
                        return Mockito.mock(GetAllTodosUsecase.class);
                }

                @Bean
                GetTodoUsecase getTodoUsecase() {
                        return Mockito.mock(GetTodoUsecase.class);
                }

                @Bean
                UpdateTodoUsecase updateTodoUsecase() {
                        return Mockito.mock(UpdateTodoUsecase.class);
                }

                @Bean
                MarkAsCompletedTodoUsecase markAsCompletedTodoUsecase() {
                        return Mockito.mock(MarkAsCompletedTodoUsecase.class);
                }

                @Bean
                MarkAsNotCompletedTodoUsecase markAsNotCompletedTodoUsecase() {
                        return Mockito.mock(MarkAsNotCompletedTodoUsecase.class);
                }

                @Bean
                DeleteTodoUsecase deleteTodoUsecase() {
                        return Mockito.mock(DeleteTodoUsecase.class);
                }
        }
}
