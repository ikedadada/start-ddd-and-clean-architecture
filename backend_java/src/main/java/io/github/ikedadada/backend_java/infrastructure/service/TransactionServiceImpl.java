package io.github.ikedadada.backend_java.infrastructure.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import io.github.ikedadada.backend_java.application_service.service.TransactionService;

@Component
public class TransactionServiceImpl implements TransactionService {
    private final TransactionTemplate transactionTemplate;

    public TransactionServiceImpl(PlatformTransactionManager platformTransactionManager) {
        this.transactionTemplate = new TransactionTemplate(platformTransactionManager);
    }

    @Override
    public <T> T run(java.util.function.Supplier<T> block) {
        return transactionTemplate.execute(status -> block.get());
    }

    @Override
    public void run(Runnable block) {
        transactionTemplate.execute(status -> {
            block.run();
            return null;
        });
    }

}
