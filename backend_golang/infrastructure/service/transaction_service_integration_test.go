package service

import (
	"backend_golang/domain/model"
	domrepo "backend_golang/domain/repository"
	"backend_golang/infrastructure"
	"backend_golang/infrastructure/repository"
	"context"
	"errors"
	"testing"
)

// This test verifies that TransactionService.Run rolls back changes when the
// callback returns an error. It uses the in-memory sqlite test DB.
func TestTransactionService_RollbackOnError(t *testing.T) {
	db := infrastructure.NewTestDB(t)
	ts := NewTransactionService(db)
	tr := repository.NewTodoRepository(db)

	ctx := context.Background()
	todo := model.NewTodo("rollback", nil)
	id := todo.Serialize().ID

	// Run a transaction that saves once and then returns an error to trigger rollback.
	err := ts.Run(ctx, func(txCtx context.Context) error {
		if err := tr.Save(txCtx, todo); err != nil {
			t.Fatalf("save within tx failed: %v", err)
		}
		return errors.New("boom")
	})
	if err == nil || err.Error() != "boom" {
		t.Fatalf("expected boom error from tx, got %v", err)
	}

	// After rollback, the record should not exist.
	if _, err := tr.FindByID(ctx, id); err == nil || !errors.Is(err, domrepo.ErrRepositoryNotFound) {
		t.Fatalf("expected not found after rollback, got %v", err)
	}
}
