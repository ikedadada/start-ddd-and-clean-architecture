package io.github.ikedadada.backend_java.application_service.usecase;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@ExtendWith(MockitoExtension.class)
class CreateTodoUsecaseImplTest {

    @Mock
    private TodoRepository todoRepository;

    @InjectMocks
    private CreateTodoUsecaseImpl usecase;

    @Test
    void handleCreatesAndSavesTodo() {
        Todo result = usecase.handle("new todo", "study application service tests");

        assertNotNull(result.getId());
        assertEquals("new todo", result.getTitle());
        assertEquals(Optional.of("study application service tests"), result.getDescription());
        assertFalse(result.isCompleted());
        verify(todoRepository).save(result);
    }
}
