package model

import "errors"

var (
	ErrTodoAlreadyCompleted = errors.New("Todo is already completed")
	ErrTodoNotCompleted     = errors.New("Todo is not completed")
)
