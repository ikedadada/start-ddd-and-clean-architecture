package usecase

import (
	"context"
	"errors"
	"testing"

	"backend_golang/domain/model"

	"github.com/google/uuid"
)

func TestDeleteTodoUsecase_Handle(t *testing.T) {
	ctx := context.Background()
	t1 := model.NewTodo("t1", nil)
	id1 := t1.Serialize().ID

	tests := []struct {
		name    string
		repo    *fakeTodoRepo
		tx      *fakeTx
		id      uuid.UUID
		wantErr error
		wantLen int
	}{
		{
			name:    "ok",
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id1: t1}},
			tx:      &fakeTx{},
			id:      id1,
			wantErr: nil,
			wantLen: 0,
		},
		{
			name:    "find error",
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id1: t1}, findErr: errFind},
			tx:      &fakeTx{},
			id:      id1,
			wantErr: errFind,
			wantLen: 1,
		},
		{
			name:    "delete error",
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id1: t1}, deleteErr: errDelete},
			tx:      &fakeTx{},
			id:      id1,
			wantErr: errDelete,
			wantLen: 1,
		},
		{
			name:    "tx error",
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id1: t1}},
			tx:      &fakeTx{retErr: errTx},
			id:      id1,
			wantErr: errTx,
			wantLen: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := NewDeleteTodoUsecase(tt.repo, tt.tx)
			err := u.Handle(ctx, tt.id)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err mismatch: got %v want %v", err, tt.wantErr)
			}
			if len(tt.repo.store) != tt.wantLen {
				t.Fatalf("store length mismatch: got %d want %d", len(tt.repo.store), tt.wantLen)
			}
		})
	}
}
