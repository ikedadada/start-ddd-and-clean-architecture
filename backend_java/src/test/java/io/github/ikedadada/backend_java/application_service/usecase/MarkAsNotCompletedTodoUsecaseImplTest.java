package io.github.ikedadada.backend_java.application_service.usecase;

import static org.junit.jupiter.api.Assertions.assertFalse;
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
class MarkAsNotCompletedTodoUsecaseImplTest {

    @Mock
    private TodoRepository todoRepository;

    @Mock
    private TransactionService transactionService;

    private MarkAsNotCompletedTodoUsecaseImpl usecase;

    @BeforeEach
    void setUp() {
        usecase = new MarkAsNotCompletedTodoUsecaseImpl(todoRepository, transactionService);
    }

    @SuppressWarnings("unchecked")
    @Test
    void handleMarksTodoNotCompletedAndSaves() {
        Todo todo = new Todo("reopen", Optional.of("mark undone"));
        todo.markAsCompleted();
        UUID id = todo.getId();
        when(todoRepository.findById(id)).thenReturn(todo);

        when(transactionService.run(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier<Todo> supplier = invocation.getArgument(0);
            return supplier.get();
        });

        Todo result = usecase.handle(id);

        assertSame(todo, result);
        assertFalse(result.isCompleted());
        verify(todoRepository).findById(id);
        verify(todoRepository).save(todo);
        verify(transactionService).run(any(Supplier.class));
    }
}
