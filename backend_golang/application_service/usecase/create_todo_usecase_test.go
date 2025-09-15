package usecase

import (
	"context"
	"errors"
	"testing"

	"backend_golang/domain/model"

	"github.com/google/uuid"
)

func TestCreateTodoUsecase_Handle(t *testing.T) {
	ctx := context.Background()
	d := "desc"
	tests := []struct {
		name    string
		input   CreateTodoUsecaseInput
		repo    *fakeTodoRepo
		wantErr error
	}{
		{
			name:  "ok with description",
			input: CreateTodoUsecaseInput{Title: "t1", Description: &d},
			repo:  &fakeTodoRepo{store: map[uuid.UUID]model.Todo{}},
		},
		{
			name:  "ok with nil description",
			input: CreateTodoUsecaseInput{Title: "t2", Description: nil},
			repo:  &fakeTodoRepo{store: map[uuid.UUID]model.Todo{}},
		},
		{
			name:    "save error",
			input:   CreateTodoUsecaseInput{Title: "t3", Description: &d},
			repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{}, saveErr: errSave},
			wantErr: errSave,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := NewCreateTodoUsecase(tt.repo)
			got, err := u.Handle(ctx, tt.input)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err mismatch: got %v want %v", err, tt.wantErr)
			}
			if tt.wantErr == nil {
				s := got.Serialize()
				if s.Title != tt.input.Title {
					t.Fatalf("title: got %q want %q", s.Title, tt.input.Title)
				}
				if (tt.input.Description == nil) != (s.Description == nil) {
					t.Fatalf("description nil mismatch: got %v want %v", s.Description == nil, tt.input.Description == nil)
				}
				if s.ID == uuid.Nil {
					t.Fatalf("id should be set")
				}
				if tt.repo.calls.save != 1 {
					t.Fatalf("save calls: got %d want 1", tt.repo.calls.save)
				}
				// lastSaved is a value copy; verify same ID
				if tt.repo.lastSaved.Serialize().ID != s.ID {
					t.Fatalf("repo lastSaved id mismatch")
				}
			}
		})
	}
}
