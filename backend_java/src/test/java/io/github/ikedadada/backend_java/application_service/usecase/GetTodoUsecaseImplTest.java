package io.github.ikedadada.backend_java.application_service.usecase;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@ExtendWith(MockitoExtension.class)
class GetTodoUsecaseImplTest {

    @Mock
    private TodoRepository todoRepository;

    private GetTodoUsecaseImpl usecase;

    @BeforeEach
    void setUp() {
        usecase = new GetTodoUsecaseImpl(todoRepository);
    }

    @Test
    void handleReturnsTodoFromRepository() {
        UUID id = UUID.randomUUID();
        Todo todo = new Todo("read", "chapter 2");
        when(todoRepository.findById(id)).thenReturn(todo);

        Todo result = usecase.handle(id);

        assertSame(todo, result);
        verify(todoRepository).findById(id);
    }
}
