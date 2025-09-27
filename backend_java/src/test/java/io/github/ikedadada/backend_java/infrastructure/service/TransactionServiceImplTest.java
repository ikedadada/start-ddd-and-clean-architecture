package io.github.ikedadada.backend_java.infrastructure.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Objects;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;

@Testcontainers
@SpringBootTest
class TransactionServiceImplTest {

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
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TransactionService transactionService;

    private int countRecords() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transaction_test_records", Integer.class);
        return Objects.requireNonNull(count);
    }

    @BeforeEach
    void resetDatabase() {
        jdbcTemplate.execute("DROP TABLE IF EXISTS transaction_test_records");
        jdbcTemplate.execute("""
                CREATE TABLE transaction_test_records (
                    id CHAR(36) PRIMARY KEY,
                    note VARCHAR(255) NOT NULL
                )
                """);
    }

    @Test
    void runSupplierCommitsTransaction() {
        int initialCount = countRecords();

        String result = transactionService.run(() -> {
            jdbcTemplate.update(
                    "INSERT INTO transaction_test_records (id, note) VALUES (?, ?)",
                    UUID.randomUUID().toString(),
                    "Transaction commit");
            return "done";
        });

        int updatedCount = countRecords();

        assertThat(result).isEqualTo("done");
        assertThat(updatedCount).isEqualTo(initialCount + 1);
    }

    @Test
    void runRunnableRollsBackOnException() {
        int initialCount = countRecords();

        assertThrows(RuntimeException.class, () -> transactionService.run(() -> {
            jdbcTemplate.update(
                    "INSERT INTO transaction_test_records (id, note) VALUES (?, ?)",
                    UUID.randomUUID().toString(),
                    "Transaction rollback");
            throw new RuntimeException("boom");
        }));

        int countAfterRollback = countRecords();

        assertThat(countAfterRollback).isEqualTo(initialCount);
    }
}
