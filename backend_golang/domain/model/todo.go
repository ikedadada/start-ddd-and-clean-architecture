package model

import "github.com/google/uuid"

type Todo struct {
	id          uuid.UUID
	title       string
	description *string
	completed   bool
}

func NewTodo(title string, description *string) Todo {
	return Todo{
		id:          newID(),
		title:       title,
		description: description,
		completed:   false,
	}
}

func (t *Todo) MarkAsCompleted() error {
	if t.completed {
		return ErrTodoAlreadyCompleted
	}
	t.completed = true
	return nil
}

func (t *Todo) MarkAsNotCompleted() error {
	if !t.completed {
		return ErrTodoNotCompleted
	}
	t.completed = false
	return nil
}

type CommandUpdateTodo struct {
	Title       string
	Description *string
}

func (c *CommandUpdateTodo) Update(t *Todo) {
	t.title = c.Title
	t.description = c.Description
}

type SerializedTodo struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	Completed   bool      `json:"completed"`
}

func (t *Todo) Serialize() SerializedTodo {
	return SerializedTodo{
		ID:          t.id,
		Title:       t.title,
		Description: t.description,
		Completed:   t.completed,
	}
}

func DeserializeTodo(data SerializedTodo) Todo {
	return Todo{
		id:          data.ID,
		title:       data.Title,
		description: data.Description,
		completed:   data.Completed,
	}
}
