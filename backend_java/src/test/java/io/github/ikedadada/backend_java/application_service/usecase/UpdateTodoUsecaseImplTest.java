package io.github.ikedadada.backend_java.application_service.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;
import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@ExtendWith(MockitoExtension.class)
class UpdateTodoUsecaseImplTest {

    @Mock
    private TodoRepository todoRepository;

    @Mock
    private TransactionService transactionService;

    private UpdateTodoUsecaseImpl usecase;

    @BeforeEach
    void setUp() {
        usecase = new UpdateTodoUsecaseImpl(todoRepository, transactionService);
    }

    @SuppressWarnings("unchecked")
    @Test
    void handleUpdatesTodoAndSavesIt() {
        UUID id = UUID.randomUUID();
        Todo existing = new Todo("old", "old description");
        when(todoRepository.findById(id)).thenReturn(existing);
        when(transactionService.run(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier<Todo> supplier = invocation.getArgument(0);
            return supplier.get();
        });

        Todo updated = usecase.handle(id, "new title", null);

        assertSame(existing, updated);
        assertEquals("new title", updated.getTitle());
        assertEquals(Optional.empty(), updated.getDescription());
        verify(todoRepository).findById(id);
        verify(todoRepository).save(existing);
        verify(transactionService).run(any(Supplier.class));
    }
}
