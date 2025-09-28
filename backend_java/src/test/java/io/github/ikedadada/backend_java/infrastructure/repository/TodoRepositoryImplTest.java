package io.github.ikedadada.backend_java.infrastructure.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.Connection;
import java.util.Optional;
import java.util.UUID;

import javax.sql.DataSource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import io.github.ikedadada.backend_java.domain.model.Todo;
import io.github.ikedadada.backend_java.domain.repository.RepositoryException;
import io.github.ikedadada.backend_java.domain.repository.TodoRepository;

@Testcontainers
@SpringBootTest
class TodoRepositoryImplTest {

    @Container
    @SuppressWarnings("resource")
    private static final MySQLContainer<?> MYSQL_CONTAINER = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("todo_api")
            .withUsername("user")
            .withPassword("password");

    @DynamicPropertySource
    private static void overrideDataSourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL_CONTAINER::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL_CONTAINER::getUsername);
        registry.add("spring.datasource.password", MYSQL_CONTAINER::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL_CONTAINER::getDriverClassName);
    }

    @Autowired
    private DataSource dataSource;

    @Autowired
    private TodoRepository todoRepository;

    @BeforeEach
    void setUpDatabase() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            ScriptUtils.executeSqlScript(connection, new ClassPathResource("sql/init.sql"));
        }
    }

    @Test
    void findAllReturnsSeededTodos() {
        var todos = todoRepository.findAll();

        assertThat(todos).hasSize(3);
        assertThat(todos)
                .extracting(Todo::getId)
                .containsExactlyInAnyOrder(
                        UUID.fromString("01994768-948a-759a-a485-3ccbb2f3a502"),
                        UUID.fromString("02994768-948a-759a-a485-3ccbb2f3a502"),
                        UUID.fromString("03994768-948a-759a-a485-3ccbb2f3a502"));
    }

    @Test
    void findByIdReturnsMatchingTodo() throws RepositoryException.TodoNotFound {
        UUID todoId = UUID.fromString("01994768-948a-759a-a485-3ccbb2f3a502");

        Todo todo = todoRepository.findById(todoId);

        assertThat(todo.getId()).isEqualTo(todoId);
        assertThat(todo.getTitle()).isEqualTo("1_Berkshire emulation deposit Sri Bacon");
        assertThat(todo.getDescription()).hasValue(
                "1_I'll index the redundant RSS firewall, that should microchip the PCI program!");
        assertThat(todo.isCompleted()).isFalse();
    }

    @Test
    void findByIdThrowsWhenTodoIsMissing() {
        assertThrows(RepositoryException.TodoNotFound.class,
                () -> todoRepository.findById(UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff")));
    }

    @Test
    void saveInsertsNewTodo() throws RepositoryException.TodoNotFound {
        Todo newTodo = new Todo("Write tests", Optional.of("Cover repository layer with Testcontainers"));

        todoRepository.save(newTodo);

        Todo stored = todoRepository.findById(newTodo.getId());
        assertThat(stored.getTitle()).isEqualTo("Write tests");
        assertThat(stored.getDescription()).hasValue("Cover repository layer with Testcontainers");
        assertThat(stored.isCompleted()).isFalse();
    }

    @Test
    void saveUpdatesExistingTodo() throws RepositoryException.TodoNotFound {
        UUID todoId = UUID.fromString("02994768-948a-759a-a485-3ccbb2f3a502");
        Todo todo = todoRepository.findById(todoId);

        todo.update("Updated title", null);
        todo.markAsCompleted();
        todoRepository.save(todo);

        Todo updated = todoRepository.findById(todoId);
        assertThat(updated.getTitle()).isEqualTo("Updated title");
        assertThat(updated.getDescription()).isEmpty();
        assertThat(updated.isCompleted()).isTrue();
    }

    @Test
    void deleteRemovesTodo() throws RepositoryException.TodoNotFound {
        UUID todoId = UUID.fromString("03994768-948a-759a-a485-3ccbb2f3a502");
        Todo todo = todoRepository.findById(todoId);

        todoRepository.delete(todo);

        assertThrows(RepositoryException.TodoNotFound.class, () -> todoRepository.findById(todoId));
    }
}
