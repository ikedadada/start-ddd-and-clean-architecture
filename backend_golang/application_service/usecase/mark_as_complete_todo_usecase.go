package usecase

import (
	"backend_golang/application_service/service"
	"backend_golang/domain/model"
	"backend_golang/domain/repository"
	"context"

	"github.com/google/uuid"
)

type MarkAsCompleteTodoUsecase interface {
	Handle(ctx context.Context, id uuid.UUID) (model.Todo, error)
}

type markAsCompleteTodoUsecaseImpl struct {
	tr repository.TodoRepository
	tx service.TransactionService
}

func NewMarkAsCompleteTodoUsecase(tr repository.TodoRepository, tx service.TransactionService) MarkAsCompleteTodoUsecase {
	return &markAsCompleteTodoUsecaseImpl{
		tr: tr,
		tx: tx,
	}
}

func (u *markAsCompleteTodoUsecaseImpl) Handle(ctx context.Context, id uuid.UUID) (todo model.Todo, err error) {
	err = u.tx.Run(ctx, func(ctx context.Context) error {
		todo, err = u.tr.FindByID(ctx, id)
		if err != nil {
			return err
		}
		if err = (&todo).MarkAsCompleted(); err != nil {
			return err
		}
		return u.tr.Save(ctx, todo)
	})
	if err != nil {
		return model.Todo{}, err
	}
	return todo, nil
}
