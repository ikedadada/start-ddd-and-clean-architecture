package repository

import (
	"backend_golang/domain/model"
	domrepo "backend_golang/domain/repository"
	"backend_golang/infrastructure"
	"context"
	"testing"

	"github.com/google/uuid"
)

func TestTodoRepository_Save(t *testing.T) {
	testDescription := "hello"
	tcs := []struct {
		name        string
		title       string
		description *string
	}{
		{name: "with description", title: "title1", description: &testDescription},
		{name: "without description", title: "title2", description: nil},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			db := infrastructure.NewTestDB(t)
			repo := NewTodoRepository(db)
			ctx := context.Background()

			todo := model.NewTodo(tc.title, tc.description)
			if err := repo.Save(ctx, todo); err != nil {
				t.Fatalf("save: %v", err)
			}

			// verify persisted
			id := todo.Serialize().ID
			got, err := repo.FindByID(ctx, id)
			if err != nil {
				t.Fatalf("find by id: %v", err)
			}
			gs := got.Serialize()
			if gs.ID != id || gs.Title != tc.title || gs.Completed != false {
				t.Fatalf("unexpected read: %+v", gs)
			}
			if (tc.description == nil && gs.Description != nil) || (tc.description != nil && (gs.Description == nil || *gs.Description != *tc.description)) {
				t.Fatalf("unexpected description: got %v want %v", gs.Description, tc.description)
			}
		})
	}
}

func TestTodoRepository_FindByID(t *testing.T) {
	db := infrastructure.NewTestDB(t)
	repo := NewTodoRepository(db)
	ctx := context.Background()

	desc := "find"
	todo := model.NewTodo("title", &desc)
	if err := repo.Save(ctx, todo); err != nil {
		t.Fatalf("save: %v", err)
	}
	savedID := todo.Serialize().ID

	tcs := []struct {
		name     string
		id       uuid.UUID
		notFound bool
	}{
		{name: "found", id: savedID, notFound: false},
		{name: "not found", id: uuid.New(), notFound: true},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got, err := repo.FindByID(ctx, tc.id)
			if tc.notFound {
				if err == nil || err != domrepo.ErrRepositoryNotFound {
					t.Fatalf("expected not found, got %v", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected err: %v", err)
			}
			if got.Serialize().ID != savedID {
				t.Fatalf("id mismatch")
			}
		})
	}
}

func TestTodoRepository_FindAll(t *testing.T) {
	t.Run("two items", func(t *testing.T) {
		db := infrastructure.NewTestDB(t)
		repo := NewTodoRepository(db)
		ctx := context.Background()
		d1, d2 := "d1", "d2"
		t1 := model.NewTodo("a", &d1)
		t2 := model.NewTodo("b", &d2)
		_ = repo.Save(ctx, t1)
		_ = repo.Save(ctx, t2)
		list, err := repo.FindAll(ctx)
		if err != nil {
			t.Fatalf("find all: %v", err)
		}
		if len(list) != 2 {
			t.Fatalf("unexpected len: %d", len(list))
		}
	})

	t.Run("empty", func(t *testing.T) {
		db := infrastructure.NewTestDB(t)
		repo := NewTodoRepository(db)
		ctx := context.Background()
		list, err := repo.FindAll(ctx)
		if err != nil {
			t.Fatalf("find all: %v", err)
		}
		if len(list) != 0 {
			t.Fatalf("unexpected len: %d", len(list))
		}
	})
}

func TestTodoRepository_Delete(t *testing.T) {
	t.Run("delete existing", func(t *testing.T) {
		db := infrastructure.NewTestDB(t)
		repo := NewTodoRepository(db)
		ctx := context.Background()
		desc := "d"
		todo := model.NewTodo("t", &desc)
		if err := repo.Save(ctx, todo); err != nil {
			t.Fatalf("save: %v", err)
		}
		id := todo.Serialize().ID
		if err := repo.Delete(ctx, todo); err != nil {
			t.Fatalf("delete: %v", err)
		}
		if _, err := repo.FindByID(ctx, id); err == nil || err != domrepo.ErrRepositoryNotFound {
			t.Fatalf("expected not found after delete, got %v", err)
		}
	})

	t.Run("delete non-existing is no-op", func(t *testing.T) {
		db := infrastructure.NewTestDB(t)
		repo := NewTodoRepository(db)
		ctx := context.Background()
		todo := model.NewTodo("x", nil) // not saved
		if err := repo.Delete(ctx, todo); err != nil {
			t.Fatalf("delete should not error, got %v", err)
		}
	})
}
