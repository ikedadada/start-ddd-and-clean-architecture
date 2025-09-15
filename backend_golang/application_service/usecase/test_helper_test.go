package usecase

import (
    "context"
    "errors"

    "backend_golang/application_service/service"
    "backend_golang/domain/model"
    "backend_golang/domain/repository"

    "github.com/google/uuid"
)

// Common errors for fakes
var (
    errSave     = errors.New("save error")
    errFind     = errors.New("find error")
    errFindAll  = errors.New("findAll error")
    errDelete   = errors.New("delete error")
    errNotFound = errors.New("not found")
    errTx       = errors.New("tx error")
)

// fakeTodoRepo implements repository.TodoRepository for tests.
type fakeTodoRepo struct {
    store map[uuid.UUID]model.Todo

    saveErr    error
    findErr    error
    findAllErr error
    deleteErr  error

    calls struct {
        save    int
        find    int
        findAll int
        delete  int
    }

    lastSaved model.Todo
}

var _ repository.TodoRepository = (*fakeTodoRepo)(nil)

func (f *fakeTodoRepo) Save(ctx context.Context, todo model.Todo) error {
    f.calls.save++
    if f.saveErr != nil {
        return f.saveErr
    }
    f.lastSaved = todo
    id := todo.Serialize().ID
    if f.store == nil {
        f.store = make(map[uuid.UUID]model.Todo)
    }
    f.store[id] = todo
    return nil
}

func (f *fakeTodoRepo) FindByID(ctx context.Context, id uuid.UUID) (model.Todo, error) {
    f.calls.find++
    if f.findErr != nil {
        return model.Todo{}, f.findErr
    }
    if t, ok := f.store[id]; ok {
        return t, nil
    }
    return model.Todo{}, errNotFound
}

func (f *fakeTodoRepo) FindAll(ctx context.Context) ([]model.Todo, error) {
    f.calls.findAll++
    if f.findAllErr != nil {
        return nil, f.findAllErr
    }
    res := make([]model.Todo, 0, len(f.store))
    for _, t := range f.store {
        res = append(res, t)
    }
    return res, nil
}

func (f *fakeTodoRepo) Delete(ctx context.Context, todo model.Todo) error {
    f.calls.delete++
    if f.deleteErr != nil {
        return f.deleteErr
    }
    id := todo.Serialize().ID
    delete(f.store, id)
    return nil
}

// fakeTx implements service.TransactionService for tests.
type fakeTx struct{ retErr error }

var _ service.TransactionService = (*fakeTx)(nil)

func (f *fakeTx) Run(ctx context.Context, fn func(ctx context.Context) error) error {
    if f.retErr != nil {
        return f.retErr
    }
    return fn(ctx)
}
