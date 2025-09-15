package usecase

import (
    "context"
    "errors"
    "testing"

    "backend_golang/domain/model"

    "github.com/google/uuid"
)

func TestMarkAsCompleteTodoUsecase_Handle(t *testing.T) {
    ctx := context.Background()
    todo := model.NewTodo("t0", nil)
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
            name:    "ok from not completed",
            prepare: func(*model.Todo) {},
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}},
            tx:      &fakeTx{},
            wantErr: nil,
            wantState: true,
        },
        {
            name:    "already completed -> error",
            prepare: func(td *model.Todo) { _ = td.MarkAsCompleted() },
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}},
            tx:      &fakeTx{},
            wantErr: model.ErrTodoAlreadyCompleted,
            wantState: true,
        },
        {
            name:    "find error",
            prepare: func(*model.Todo) {},
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}, findErr: errFind},
            tx:      &fakeTx{},
            wantErr: errFind,
            wantState: false,
        },
        {
            name:    "save error (state not persisted)",
            prepare: func(*model.Todo) {},
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}, saveErr: errSave},
            tx:      &fakeTx{},
            wantErr: errSave,
            wantState: false,
        },
        {
            name:    "tx error",
            prepare: func(*model.Todo) {},
            repo:    &fakeTodoRepo{store: map[uuid.UUID]model.Todo{id: todo}},
            tx:      &fakeTx{retErr: errTx},
            wantErr: errTx,
            wantState: false,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Reset repo state per test and apply prepare to stored value
            td := model.DeserializeTodo(todo.Serialize())
            id := td.Serialize().ID
            prep := td
            tt.prepare(&prep)
            tt.repo.store = map[uuid.UUID]model.Todo{id: prep}

            u := NewMarkAsCompleteTodoUsecase(tt.repo, tt.tx)
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
                if !got.Serialize().Completed {
                    t.Fatalf("returned todo should be completed")
                }
            }
        })
    }
}
