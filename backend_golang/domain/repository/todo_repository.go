package repository

import (
	"backend_golang/domain/model"
	"context"

	"github.com/google/uuid"
)

type TodoRepository interface {
	Save(ctx context.Context, todo model.Todo) error
	FindByID(ctx context.Context, id uuid.UUID) (model.Todo, error)
	FindAll(ctx context.Context) ([]model.Todo, error)
	Delete(ctx context.Context, todo model.Todo) error
}
