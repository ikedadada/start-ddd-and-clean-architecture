package usecase

import (
	"backend_golang/application_service/service"
	"backend_golang/domain/repository"
	"context"

	"github.com/google/uuid"
)

type DeleteTodoUsecase interface {
	Handle(ctx context.Context, id uuid.UUID) error
}

type deleteTodoUsecaseImpl struct {
	tr repository.TodoRepository
	tx service.TransactionService
}

func NewDeleteTodoUsecase(tr repository.TodoRepository, tx service.TransactionService) DeleteTodoUsecase {
	return &deleteTodoUsecaseImpl{
		tr: tr,
		tx: tx,
	}
}

func (u *deleteTodoUsecaseImpl) Handle(ctx context.Context, id uuid.UUID) error {
	return u.tx.Run(ctx, func(ctx context.Context) error {
		todo, err := u.tr.FindByID(ctx, id)
		if err != nil {
			return err
		}
		if err := u.tr.Delete(ctx, todo); err != nil {
			return err
		}
		return nil
	})
}
