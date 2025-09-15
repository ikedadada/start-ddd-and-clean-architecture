package usecase

import (
	"backend_golang/domain/model"
	"backend_golang/domain/repository"
	"context"
)

type CreateTodoUsecaseInput struct {
	Title       string
	Description *string
}

type CreateTodoUsecase interface {
	Handle(ctx context.Context, input CreateTodoUsecaseInput) (model.Todo, error)
}

type createTodoUsecaseImpl struct {
	tr repository.TodoRepository
}

func NewCreateTodoUsecase(tr repository.TodoRepository) CreateTodoUsecase {
	return &createTodoUsecaseImpl{
		tr: tr,
	}
}

func (u *createTodoUsecaseImpl) Handle(ctx context.Context, input CreateTodoUsecaseInput) (model.Todo, error) {
	todo := model.NewTodo(input.Title, input.Description)
	if err := u.tr.Save(ctx, todo); err != nil {
		return model.Todo{}, err
	}
	return todo, nil
}
