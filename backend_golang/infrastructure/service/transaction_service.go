package service

import (
	"backend_golang/infrastructure"
	"context"
	"fmt"

	"gorm.io/gorm"
)

type TransactionService struct {
	db *infrastructure.DB
}

func NewTransactionService(db *infrastructure.DB) *TransactionService {
	return &TransactionService{db: db}
}

func (s *TransactionService) Run(ctx context.Context, fn func(ctx context.Context) error) (err error) {
	tx := s.db.Begin()
	defer func(tx *gorm.DB) {
		if r := recover(); r != nil {
			tx.Rollback()
			err = fmt.Errorf("recovered panic, err: %v", r)
		}
	}(tx)
	ctx = infrastructure.WithTx(ctx, tx)
	if err = fn(ctx); err != nil {
		tx.Rollback()
		return
	}
	return tx.Commit().Error
}
