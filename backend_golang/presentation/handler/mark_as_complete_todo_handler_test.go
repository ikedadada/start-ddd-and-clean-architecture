package handler

import (
    "backend_golang/application_service/usecase"
    "backend_golang/domain/model"
    "backend_golang/domain/repository"
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/google/uuid"
)

type stubMarkAsCompleteUsecase struct {
    handleFunc func(ctx context.Context, id uuid.UUID) (model.Todo, error)
    calls      int
}

var _ usecase.MarkAsCompleteTodoUsecase = (*stubMarkAsCompleteUsecase)(nil)

func (s *stubMarkAsCompleteUsecase) Handle(ctx context.Context, id uuid.UUID) (model.Todo, error) {
    s.calls++
    if s.handleFunc != nil {
        return s.handleFunc(ctx, id)
    }
    return model.Todo{}, nil
}

func TestMarkAsCompleteHandler(t *testing.T) {
    e := newEcho()
    id := uuid.New()
    desc := "d"
    ret := model.DeserializeTodo(model.SerializedTodo{ID: id, Title: "t", Description: &desc, Completed: true})

    tcs := []struct {
        name       string
        path       string
        stubFunc   func(ctx context.Context, id uuid.UUID) (model.Todo, error)
        wantStatus int
        assert     func(t *testing.T, rec *httptest.ResponseRecorder)
    }{
        {
            name: "success 200",
            path: "/todos/" + id.String() + "/complete",
            stubFunc: func(ctx context.Context, got uuid.UUID) (model.Todo, error) {
                if got != id {
                    t.Fatalf("unexpected id")
                }
                return ret, nil
            },
            wantStatus: http.StatusOK,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder) {
                var got MarkAsCompleteTodoResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                if got.ID != id || got.Completed != true {
                    t.Fatalf("unexpected response: %+v", got)
                }
            },
        },
        {
            name:       "bad id 400",
            path:       "/todos/bad/complete",
            stubFunc:   nil,
            wantStatus: http.StatusBadRequest,
        },
        {
            name:       "conflict 409",
            path:       "/todos/" + id.String() + "/complete",
            stubFunc:   func(ctx context.Context, id uuid.UUID) (model.Todo, error) { return model.Todo{}, model.ErrTodoAlreadyCompleted },
            wantStatus: http.StatusConflict,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder) {
                var herr httpErrorResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &herr); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                if herr.Message != "Todo already completed" {
                    t.Fatalf("unexpected message: %q", herr.Message)
                }
            },
        },
        {
            name:       "not found 404",
            path:       "/todos/" + id.String() + "/complete",
            stubFunc:   func(ctx context.Context, id uuid.UUID) (model.Todo, error) { return model.Todo{}, repository.ErrRepositoryNotFound },
            wantStatus: http.StatusNotFound,
        },
    }

    for _, tc := range tcs {
        t.Run(tc.name, func(t *testing.T) {
            stub := &stubMarkAsCompleteUsecase{handleFunc: tc.stubFunc}
            h := NewMarkAsCompleteTodoHandler(stub)
            e.PUT("/todos/:id/complete", h.Handle)

            req := httptest.NewRequest(http.MethodPut, tc.path, nil)
            rec := httptest.NewRecorder()
            e.ServeHTTP(rec, req)

            if rec.Code != tc.wantStatus {
                t.Fatalf("status: got %d want %d", rec.Code, tc.wantStatus)
            }
            if tc.assert != nil {
                tc.assert(t, rec)
            }
        })
    }
}
