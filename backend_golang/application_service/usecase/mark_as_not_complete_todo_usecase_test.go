package usecase

import (
    "context"
    "errors"
    "testing"

    "backend_golang/domain/model"

    "github.com/google/uuid"
)

func TestMarkAsNotCompleteTodoUsecase_Handle(t *testing.T) {
    ctx := context.Background()
    todo := model.NewTodo("t0", nil)
    _ = todo.MarkAsCompleted()
    id := todo.Serialize().ID

    tests := []struct {
        name      string
        prepare   func(*model.Todo)
        repo      *fakeTodoRepo
        tx        *fakeTx
        wantErr   error
        wantState bool
    }{
        {
            name:    "ok from completed",
            prepare: func(td *model.Todo) { _ = td.MarkAsCompleted() },
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}},
            tx:      &fakeTx{},
            wantErr: nil,
            wantState: false,
        },
        {
            name:    "not completed -> error",
            prepare: func(td *model.Todo) { _ = td.MarkAsNotCompleted() },
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}},
            tx:      &fakeTx{},
            wantErr: model.ErrTodoNotCompleted,
            wantState: false,
        },
        {
            name:    "find error",
            prepare: func(td *model.Todo) { _ = td.MarkAsCompleted() },
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}, findErr: errFind},
            tx:      &fakeTx{},
            wantErr: errFind,
            wantState: true,
        },
        {
            name:    "save error (state not persisted)",
            prepare: func(td *model.Todo) { _ = td.MarkAsCompleted() },
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}, saveErr: errSave},
            tx:      &fakeTx{},
            wantErr: errSave,
            wantState: true,
        },
        {
            name:    "tx error",
            prepare: func(td *model.Todo) { _ = td.MarkAsCompleted() },
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}},
            tx:      &fakeTx{retErr: errTx},
            wantErr: errTx,
            wantState: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // fresh copy per test; apply prepare on value and store back
            fresh := model.DeserializeTodo(todo.Serialize())
            id := fresh.Serialize().ID
            prep := fresh
            tt.prepare(&prep)
            tt.repo.store = map[uuid.UUID]model.Todo{id: prep}

            u := NewMarkAsNotCompleteTodoUsecase(tt.repo, tt.tx)
            got, err := u.Handle(ctx, id)
            if !errors.Is(err, tt.wantErr) {
                t.Fatalf("err mismatch: got %v want %v", err, tt.wantErr)
            }
            s := tt.repo.store[id]
            repoCompleted := s.Serialize().Completed
            if repoCompleted != tt.wantState {
                t.Fatalf("repo state mismatch: got %v want %v", repoCompleted, tt.wantState)
            }
            if err == nil {
                if got.Serialize().Completed != tt.wantState {
                    t.Fatalf("returned todo completed mismatch: got %v want %v", got.Serialize().Completed, tt.wantState)
                }
            }
        })
    }
}
