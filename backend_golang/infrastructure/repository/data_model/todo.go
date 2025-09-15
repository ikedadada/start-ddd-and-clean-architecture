package data_model

import (
	"backend_golang/domain/model"

	"github.com/google/uuid"
)

type Todo struct {
	ID          string  `gorm:"type:uuid;primaryKey"`
	Title       string  `gorm:"type:varchar(255);not null"`
	Description *string `gorm:"type:text"`
	Completed   bool    `gorm:"type:boolean;not null"`
}

func (Todo) TableName() string {
	return "todos"
}

func (t *Todo) ToModel() model.Todo {
	return model.DeserializeTodo(
		model.SerializedTodo{
			ID:          uuid.MustParse(t.ID),
			Title:       t.Title,
			Description: t.Description,
			Completed:   t.Completed,
		},
	)
}

func FromModel(m model.Todo) Todo {
	s := m.Serialize()
	return Todo{
		ID:          s.ID.String(),
		Title:       s.Title,
		Description: s.Description,
		Completed:   s.Completed,
	}
}
