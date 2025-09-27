package io.github.ikedadada.backend_java.application_service.usecase;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
class MarkAsCompletedTodoUsecaseImplTest {

    @Mock
    private TodoRepository todoRepository;

    @Mock
    private TransactionService transactionService;

    private MarkAsCompletedTodoUsecaseImpl usecase;

    @BeforeEach
    void setUp() {
        usecase = new MarkAsCompletedTodoUsecaseImpl(todoRepository, transactionService);
    }

    @SuppressWarnings("unchecked")
    @Test
    void handleMarksTodoCompletedAndSaves() {
        Todo todo = new Todo("finish", "mark completed");
        UUID id = todo.getId();
        when(todoRepository.findById(id)).thenReturn(todo);
        when(transactionService.run(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier<Todo> supplier = invocation.getArgument(0);
            return supplier.get();
        });

        Todo result = usecase.handle(id);

        assertSame(todo, result);
        assertTrue(result.isCompleted());
        verify(todoRepository).findById(id);
        verify(todoRepository).save(todo);
        verify(transactionService).run(any(Supplier.class));
    }
}
