package usecase

import (
	"backend_golang/domain/model"
	"backend_golang/domain/repository"
	"context"

	"github.com/google/uuid"
)

type GetTodoUsecase interface {
    Handle(ctx context.Context, id uuid.UUID) (model.Todo, error)
}

type getTodoUsecaseImpl struct {
	tr repository.TodoRepository
}

func NewGetTodoUsecase(tr repository.TodoRepository) GetTodoUsecase {
	return &getTodoUsecaseImpl{
		tr: tr,
	}
}

func (u *getTodoUsecaseImpl) Handle(ctx context.Context, id uuid.UUID) (model.Todo, error) {
	return u.tr.FindByID(ctx, id)
}
