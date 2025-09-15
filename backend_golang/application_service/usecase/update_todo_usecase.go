package usecase

import (
	"backend_golang/application_service/service"
	"backend_golang/domain/model"
	"backend_golang/domain/repository"
	"context"

	"github.com/google/uuid"
)

type UpdateTodoUsecaseInput struct {
	ID          uuid.UUID
	Title       string
	Description *string
}

type UpdateTodoUsecase interface {
	Handle(ctx context.Context, input UpdateTodoUsecaseInput) (model.Todo, error)
}

type updateTodoUsecaseImpl struct {
	tr repository.TodoRepository
	tx service.TransactionService
}

func NewUpdateTodoUsecase(tr repository.TodoRepository, tx service.TransactionService) UpdateTodoUsecase {
	return &updateTodoUsecaseImpl{
		tr: tr,
		tx: tx,
	}
}

func (u *updateTodoUsecaseImpl) Handle(ctx context.Context, input UpdateTodoUsecaseInput) (todo model.Todo, err error) {
	err = u.tx.Run(ctx, func(ctx context.Context) error {
		todo, err = u.tr.FindByID(ctx, input.ID)
		if err != nil {
			return err
		}
		cmd := model.CommandUpdateTodo{
			Title:       input.Title,
			Description: input.Description,
		}
		cmd.Update(&todo)
		return u.tr.Save(ctx, todo)
	})
	if err != nil {
		return model.Todo{}, err
	}
	return todo, nil
}
