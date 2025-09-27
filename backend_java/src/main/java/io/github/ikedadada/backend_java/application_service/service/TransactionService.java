package io.github.ikedadada.backend_java.application_service.service;

import java.util.function.Supplier;

public interface TransactionService {
    <T> T run(Supplier<T> block);

    void run(Runnable block);
}
