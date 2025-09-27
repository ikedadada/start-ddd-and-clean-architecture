package io.github.ikedadada.backend_java.infrastructure.service;

import org.springframework.stereotype.Component;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;

@Component
public class TransactionServiceImpl implements TransactionService {
    @Override
    public <T> T run(java.util.function.Supplier<T> block) {
        // In a real application, you would manage transactions here.
        return block.get();
    }

    @Override
    public void run(Runnable block) {
        // In a real application, you would manage transactions here.
        block.run();
    }

}
