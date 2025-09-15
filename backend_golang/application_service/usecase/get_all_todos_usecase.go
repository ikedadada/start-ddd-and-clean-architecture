package usecase

import (
	"backend_golang/domain/model"
	"backend_golang/domain/repository"
	"context"
)

type GetAllTodosUsecase interface {
	Handle(ctx context.Context) ([]model.Todo, error)
}

type getAllTodosUsecaseImpl struct {
	tr repository.TodoRepository
}

func NewGetAllTodosUsecase(tr repository.TodoRepository) GetAllTodosUsecase {
	return &getAllTodosUsecaseImpl{
		tr: tr,
	}
}

func (u *getAllTodosUsecaseImpl) Handle(ctx context.Context) ([]model.Todo, error) {
	return u.tr.FindAll(ctx)
}
