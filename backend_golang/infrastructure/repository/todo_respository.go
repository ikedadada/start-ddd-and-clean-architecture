package repository

import (
	"backend_golang/domain/model"
	"backend_golang/domain/repository"
	"backend_golang/infrastructure"
	"backend_golang/infrastructure/repository/data_model"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type todoRepository struct {
	db *infrastructure.DB
}

func NewTodoRepository(db *infrastructure.DB) repository.TodoRepository {
	return &todoRepository{db: db}
}

func (r *todoRepository) Save(ctx context.Context, todo model.Todo) error {
	conn := r.db.Conn(ctx)

	dt := data_model.FromModel(todo)
	if err := conn.Save(&dt).Error; err != nil {
		return err
	}
	return nil
}

func (r *todoRepository) FindByID(ctx context.Context, id uuid.UUID) (model.Todo, error) {
	conn := r.db.Conn(ctx)

	var dt data_model.Todo
	if err := conn.First(&dt, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.Todo{}, repository.ErrRepositoryNotFound
		}
		return model.Todo{}, err
	}
	return dt.ToModel(), nil
}

func (r *todoRepository) FindAll(ctx context.Context) ([]model.Todo, error) {
	conn := r.db.Conn(ctx)

	var dts []data_model.Todo
	if err := conn.Find(&dts).Error; err != nil {
		return nil, err
	}

	todos := make([]model.Todo, len(dts))
	for i, dt := range dts {
		todos[i] = dt.ToModel()
	}
	return todos, nil
}

func (r *todoRepository) Delete(ctx context.Context, todo model.Todo) error {
	conn := r.db.Conn(ctx)

	dt := data_model.FromModel(todo)
	if err := conn.Delete(&dt).Error; err != nil {
		return err
	}
	return nil
}
