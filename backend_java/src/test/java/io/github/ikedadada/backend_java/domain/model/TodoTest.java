package io.github.ikedadada.backend_java.domain.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TodoTest {

    @Test
    @DisplayName("Newly created todo keeps id and description and starts incomplete")
    void constructorInitializesFields() {
        Todo todo = new Todo("study DDD", "read chapter 1");

        assertNotNull(todo.getId());
        assertEquals("study DDD", todo.getTitle());
        assertEquals(Optional.of("read chapter 1"), todo.getDescription());
        assertFalse(todo.isCompleted());
    }

    @Test
    @DisplayName("Todo can be marked completed and double completion throws")
    void markAsCompleted() {
        Todo todo = new Todo("write tests", "mark completion");

        todo.markAsCompleted();
        assertTrue(todo.isCompleted());

        DomainException.TodoAlreadyCompleted ex = assertThrows(
                DomainException.TodoAlreadyCompleted.class,
                todo::markAsCompleted);
        assertTrue(ex.getMessage().contains(todo.getId().toString()));
    }

    @Test
    @DisplayName("Completed todo can be undone and undoing twice throws")
    void markAsUndone() {
        Todo todo = new Todo("practice", null);

        todo.markAsCompleted();
        todo.markAsNotCompleted();
        assertFalse(todo.isCompleted());

        DomainException.TodoNotCompleted ex = assertThrows(
                DomainException.TodoNotCompleted.class,
                todo::markAsNotCompleted);
        assertTrue(ex.getMessage().contains(todo.getId().toString()));
    }

    @Test
    @DisplayName("Updating applies new title and description")
    void updateChangesFields() {
        Todo todo = new Todo("initial", "initial description");

        todo.update("updated", null);

        assertEquals("updated", todo.getTitle());
        assertEquals(Optional.empty(), todo.getDescription());
    }

    @Test
    @DisplayName("DTO round trip preserves values")
    void dtoRoundTripRetainsValues() {
        Todo original = new Todo("dto", "round trip");
        original.markAsCompleted();

        Todo.DTO dto = new Todo.DTO(original);
        Todo restored = dto.toDomain();

        assertEquals(original.getId(), dto.id);
        assertEquals(original.getTitle(), dto.title);
        assertEquals(original.getDescription().orElse(null), dto.description);
        assertEquals(original.isCompleted(), dto.completed);

        assertEquals(dto.id, restored.getId());
        assertEquals(dto.title, restored.getTitle());
        assertEquals(Optional.ofNullable(dto.description), restored.getDescription());
        assertEquals(dto.completed, restored.isCompleted());
    }

    @Test
    @DisplayName("Updating with null title throws NullPointerException")
    void updateWithNullTitleThrowsException() {
        Todo todo = new Todo("title", "desc");

        assertThrows(NullPointerException.class, () -> todo.update(null, "desc"));
    }

    @Test
    @DisplayName("DTO to domain requires non null id")
    void dtoToDomainRequiresNonNullId() {
        Todo todo = new Todo("dummy", "desc");
        Todo.DTO dto = new Todo.DTO(todo);
        dto.id = null;

        assertThrows(NullPointerException.class, dto::toDomain);
    }

    @Test
    @DisplayName("DTO to domain requires non null title")
    void dtoToDomainRequiresNonNullTitle() {
        Todo todo = new Todo("dummy", "desc");
        Todo.DTO dto = new Todo.DTO(todo);
        dto.title = null;

        assertThrows(NullPointerException.class, dto::toDomain);
    }
}
