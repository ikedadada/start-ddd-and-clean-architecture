package io.github.ikedadada.backend_java.application_service.usecase;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;
import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@ExtendWith(MockitoExtension.class)
class DeleteTodoUsecaseImplTest {

    @Mock
    private TodoRepository todoRepository;

    @Mock
    private TransactionService transactionService;

    private DeleteTodoUsecaseImpl usecase;

    @BeforeEach
    void setUp() {
        usecase = new DeleteTodoUsecaseImpl(todoRepository, transactionService);
    }

    @Test
    void handleDeletesTodoInsideTransaction() {
        Todo todo = new Todo("delete", Optional.of("target"));
        UUID id = todo.getId();
        when(todoRepository.findById(id)).thenReturn(todo);
        doAnswer(invocation -> {
            Runnable runnable = invocation.getArgument(0);
            runnable.run();
            return null;
        }).when(transactionService).run(any(Runnable.class));

        usecase.handle(id);

        verify(todoRepository).findById(id);
        verify(todoRepository).delete(todo);
        verify(transactionService).run(any(Runnable.class));
    }
}
