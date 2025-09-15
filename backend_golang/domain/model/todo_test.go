package model

import (
	"reflect"
	"testing"

	"github.com/google/uuid"
)

func TestNewTodo(t *testing.T) {
	desc := "test description"
	tests := []struct {
		name        string
		title       string
		description *string
		wantDescNil bool
	}{
		{
			name:        "with description",
			title:       "title A",
			description: &desc,
			wantDescNil: false,
		},
		{
			name:        "without description (nil)",
			title:       "title B",
			description: nil,
			wantDescNil: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			todo := NewTodo(tt.title, tt.description)
			got := todo.Serialize()

			if got.Title != tt.title {
				t.Fatalf("Title mismatch: got %q want %q", got.Title, tt.title)
			}
			if tt.wantDescNil {
				if got.Description != nil {
					t.Fatalf("Description: got non-nil, want nil")
				}
			} else {
				if got.Description == nil || *got.Description != *tt.description {
					t.Fatalf("Description mismatch: got %v want %v", got.Description, tt.description)
				}
			}
			if got.Completed {
				t.Fatalf("Completed should be false on new todo")
			}
			if got.ID == uuid.Nil {
				t.Fatalf("ID should not be nil")
			}
		})
	}
}

func TestTodo_CompletionToggles(t *testing.T) {
    desc := "x"
    tests := []struct {
        name      string
        setup     func(*Todo)
        action    func(*Todo) error
        wantErr   error
        wantState bool
    }{
        {
            name:      "MarkAsCompleted from false",
            setup:     func(*Todo) {},
            action:    func(td *Todo) error { return td.MarkAsCompleted() },
            wantErr:   nil,
            wantState: true,
        },
        {
            name:  "MarkAsNotCompleted from true",
            setup: func(td *Todo) { if err := td.MarkAsCompleted(); err != nil { t.Fatalf("setup failed: %v", err) } },
            action: func(td *Todo) error { return td.MarkAsNotCompleted() },
            wantErr:   nil,
            wantState: false,
        },
        {
            name:      "MarkAsNotCompleted from false returns error",
            setup:     func(*Todo) {},
            action:    func(td *Todo) error { return td.MarkAsNotCompleted() },
            wantErr:   ErrTodoNotCompleted,
            wantState: false,
        },
        {
            name:  "MarkAsCompleted twice returns error",
            setup: func(td *Todo) { if err := td.MarkAsCompleted(); err != nil { t.Fatalf("setup failed: %v", err) } },
            action: func(td *Todo) error { return td.MarkAsCompleted() },
            wantErr:   ErrTodoAlreadyCompleted,
            wantState: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            td := NewTodo("t", &desc)
            tt.setup(&td)
            err := tt.action(&td)
            if err != tt.wantErr {
                t.Fatalf("error mismatch: got %v want %v", err, tt.wantErr)
            }
            got := td.Serialize().Completed
            if got != tt.wantState {
                t.Fatalf("Completed mismatch: got %v want %v", got, tt.wantState)
            }
        })
    }
}

func TestCommandUpdateTodo_Update(t *testing.T) {
	initialDesc := "initial"
	newDesc := "updated"
	tests := []struct {
		name        string
		initialDesc *string
		cmd         CommandUpdateTodo
		wantTitle   string
		wantDesc    *string
	}{
		{
			name:        "update title and description to non-nil",
			initialDesc: &initialDesc,
			cmd:         CommandUpdateTodo{Title: "new title", Description: &newDesc},
			wantTitle:   "new title",
			wantDesc:    &newDesc,
		},
		{
			name:        "update title and set description to nil",
			initialDesc: &initialDesc,
			cmd:         CommandUpdateTodo{Title: "newer title", Description: nil},
			wantTitle:   "newer title",
			wantDesc:    nil,
		},
		{
			name:        "update when initial description is nil",
			initialDesc: nil,
			cmd:         CommandUpdateTodo{Title: "t", Description: &newDesc},
			wantTitle:   "t",
			wantDesc:    &newDesc,
		},
	}

	for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            todo := NewTodo("init", tt.initialDesc)
            tt.cmd.Update(&todo)
            got := todo.Serialize()

			if got.Title != tt.wantTitle {
				t.Fatalf("Title mismatch: got %q want %q", got.Title, tt.wantTitle)
			}

			switch {
			case tt.wantDesc == nil && got.Description != nil:
				t.Fatalf("Description: got non-nil, want nil")
			case tt.wantDesc != nil && got.Description == nil:
				t.Fatalf("Description: got nil, want non-nil %q", *tt.wantDesc)
			case tt.wantDesc != nil && got.Description != nil && *got.Description != *tt.wantDesc:
				t.Fatalf("Description mismatch: got %q want %q", *got.Description, *tt.wantDesc)
			}
		})
	}
}

func TestDeserializeTodo_Roundtrip(t *testing.T) {
	d := "roundtrip"
	fixed := uuid.MustParse("123e4567-e89b-12d3-a456-426614174000")
	tests := []struct {
		name string
		in   SerializedTodo
	}{
		{
			name: "with description and completed=true",
			in: SerializedTodo{
				ID:          fixed,
				Title:       "todo x",
				Description: &d,
				Completed:   true,
			},
		},
		{
			name: "without description and completed=false",
			in: SerializedTodo{
				ID:          fixed,
				Title:       "todo y",
				Description: nil,
				Completed:   false,
			},
		},
	}

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            td := DeserializeTodo(tt.in)
            got := td.Serialize()
            if !reflect.DeepEqual(got, tt.in) {
                t.Fatalf("roundtrip mismatch:\n got: %#v\nwant: %#v", got, tt.in)
            }
        })
    }
}
