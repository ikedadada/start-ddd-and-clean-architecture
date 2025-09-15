package usecase

import (
	"backend_golang/application_service/service"
	"backend_golang/domain/model"
	"backend_golang/domain/repository"
	"context"

	"github.com/google/uuid"
)

type MarkAsNotCompleteTodoUsecase interface {
	Handle(ctx context.Context, id uuid.UUID) (model.Todo, error)
}

type markAsNotCompleteTodoUsecaseImpl struct {
	tr repository.TodoRepository
	tx service.TransactionService
}

func NewMarkAsNotCompleteTodoUsecase(tr repository.TodoRepository, tx service.TransactionService) MarkAsNotCompleteTodoUsecase {
	return &markAsNotCompleteTodoUsecaseImpl{
		tr: tr,
		tx: tx,
	}
}

func (u *markAsNotCompleteTodoUsecaseImpl) Handle(ctx context.Context, id uuid.UUID) (todo model.Todo, err error) {
	err = u.tx.Run(ctx, func(ctx context.Context) error {
		todo, err = u.tr.FindByID(ctx, id)
		if err != nil {
			return err
		}
		if err = (&todo).MarkAsNotCompleted(); err != nil {
			return err
		}
		return u.tr.Save(ctx, todo)
	})
	if err != nil {
		return model.Todo{}, err
	}
	return todo, nil
}
