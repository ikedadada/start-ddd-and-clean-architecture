package io.github.ikedadada.backend_java.application_service.usecase;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@ExtendWith(MockitoExtension.class)
class GetAllTodosUsecaseImplTest {

    @Mock
    private TodoRepository todoRepository;

    private GetAllTodosUsecaseImpl usecase;

    @BeforeEach
    void setUp() {
        usecase = new GetAllTodosUsecaseImpl(todoRepository);
    }

    @Test
    void handleDelegatesToRepository() {
        ArrayList<Todo> todos = new ArrayList<>();
        when(todoRepository.findAll()).thenReturn(todos);

        ArrayList<Todo> result = usecase.handle();

        assertSame(todos, result);
        verify(todoRepository).findAll();
    }
}
