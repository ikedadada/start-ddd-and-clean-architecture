package usecase

import (
	"context"
	"errors"
	"testing"

	"backend_golang/domain/model"

	"github.com/google/uuid"
)

func TestGetAllTodosUsecase_Handle(t *testing.T) {
	ctx := context.Background()
	t1 := model.NewTodo("t1", nil)
	t2 := model.NewTodo("t2", nil)
	id1 := t1.Serialize().ID
	id2 := t2.Serialize().ID

	tests := []struct {
		name    string
		repo    *fakeTodoRepo
		wantLen int
		wantErr error
	}{
		{
			name:    "ok",
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id1: t1, id2: t2}},
			wantLen: 2,
		},
		{
			name:    "error",
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id1: t1}, findAllErr: errFindAll},
			wantLen: 0,
			wantErr: errFindAll,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := NewGetAllTodosUsecase(tt.repo)
			got, err := u.Handle(ctx)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err mismatch: got %v want %v", err, tt.wantErr)
			}
			if tt.wantErr == nil {
				if len(got) != tt.wantLen {
					t.Fatalf("length mismatch: got %d want %d", len(got), tt.wantLen)
				}
			}
		})
	}
}
