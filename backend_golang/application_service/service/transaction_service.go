package service

import "context"

type TransactionService interface {
	Run(ctx context.Context, fn func(ctx context.Context) error) error
}
