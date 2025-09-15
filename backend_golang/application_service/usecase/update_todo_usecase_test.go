package usecase

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"backend_golang/domain/model"

	"github.com/google/uuid"
)

func TestUpdateTodoUsecase_Handle(t *testing.T) {
	ctx := context.Background()
	initialDesc := "initial"
	updatedDesc := "updated"
	todo := model.NewTodo("t0", &initialDesc)
	id := todo.Serialize().ID

	tests := []struct {
		name    string
		repo    *fakeTodoRepo
		tx      *fakeTx
		input   UpdateTodoUsecaseInput
		wantErr error
	}{
		{
			name:  "ok update fields",
			repo:  &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}},
			tx:    &fakeTx{},
			input: UpdateTodoUsecaseInput{ID: id, Title: "t1", Description: &updatedDesc},
		},
		{
			name:    "find error",
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}, findErr: errFind},
			tx:      &fakeTx{},
			input:   UpdateTodoUsecaseInput{ID: id, Title: "t1", Description: &updatedDesc},
			wantErr: errFind,
		},
		{
			name:    "save error",
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}, saveErr: errSave},
			tx:      &fakeTx{},
			input:   UpdateTodoUsecaseInput{ID: id, Title: "t1", Description: &updatedDesc},
			wantErr: errSave,
		},
		{
			name:    "tx error",
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}},
			tx:      &fakeTx{retErr: errTx},
			input:   UpdateTodoUsecaseInput{ID: id, Title: "t1", Description: &updatedDesc},
			wantErr: errTx,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := NewUpdateTodoUsecase(tt.repo, tt.tx)
			got, err := u.Handle(ctx, tt.input)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err mismatch: got %v want %v", err, tt.wantErr)
			}
			if tt.wantErr == nil {
				// Expect repository saved state to reflect updates
				saved := tt.repo.store[id]
				s := saved.Serialize()
				if s.Title != tt.input.Title || !reflect.DeepEqual(s.Description, tt.input.Description) {
					t.Fatalf("saved state mismatch: got %+v", s)
				}
				// Also expect returned value to reflect updates (contract)
				gs := got.Serialize()
				if gs.Title != tt.input.Title || !reflect.DeepEqual(gs.Description, tt.input.Description) {
					t.Fatalf("returned todo mismatch: got %+v", gs)
				}
			}
		})
	}
}
