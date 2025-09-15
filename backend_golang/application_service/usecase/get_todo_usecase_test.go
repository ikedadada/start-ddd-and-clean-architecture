package usecase

import (
	"context"
	"errors"
	"testing"

	"backend_golang/domain/model"

	"github.com/google/uuid"
)

func TestGetTodoUsecase_Handle(t *testing.T) {
	ctx := context.Background()
	t1 := model.NewTodo("t1", nil)
	id1 := t1.Serialize().ID

	tests := []struct {
		name    string
		id      uuid.UUID
		repo    *fakeTodoRepo
		want    model.Todo
		wantErr error
	}{
		{
			name:    "ok",
			id:      id1,
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id1: t1}},
			want:    t1,
			wantErr: nil,
		},
		{
			name:    "find error",
			id:      id1,
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id1: t1}, findErr: errFind},
			want:    model.Todo{},
			wantErr: errFind,
		},
		{
			name:    "not found",
			id:      uuid.New(),
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{}},
			want:    model.Todo{},
			wantErr: errNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := NewGetTodoUsecase(tt.repo)
			got, err := u.Handle(ctx, tt.id)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err mismatch: got %v want %v", err, tt.wantErr)
			}
			// Compare by ID for simplicity
			if err == nil {
				if got.Serialize().ID != tt.want.Serialize().ID {
					t.Fatalf("id mismatch: got %v want %v", got.Serialize().ID, tt.want.Serialize().ID)
				}
			}
		})
	}
}
