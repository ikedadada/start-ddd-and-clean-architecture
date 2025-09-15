package handler

import (
    "backend_golang/application_service/usecase"
    "backend_golang/domain/model"
    "backend_golang/domain/repository"
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"

    "github.com/google/uuid"
)

type stubUpdateTodoUsecase struct {
    handleFunc func(ctx context.Context, input usecase.UpdateTodoUsecaseInput) (model.Todo, error)
    calls      int
    lastInput  usecase.UpdateTodoUsecaseInput
}

var _ usecase.UpdateTodoUsecase = (*stubUpdateTodoUsecase)(nil)

func (s *stubUpdateTodoUsecase) Handle(ctx context.Context, input usecase.UpdateTodoUsecaseInput) (model.Todo, error) {
    s.calls++
    s.lastInput = input
    if s.handleFunc != nil {
        return s.handleFunc(ctx, input)
    }
    return model.Todo{}, nil
}

func TestUpdateTodoHandler(t *testing.T) {
    e := newEcho()
    id := uuid.New()
    desc := "d"
    ret := model.DeserializeTodo(model.SerializedTodo{ID: id, Title: "new", Description: &desc, Completed: true})

    tcs := []struct {
        name       string
        path       string
        body       string
        stubFunc   func(ctx context.Context, in usecase.UpdateTodoUsecaseInput) (model.Todo, error)
        wantStatus int
        assert     func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubUpdateTodoUsecase)
    }{
        {
            name: "success 200",
            path: "/todos/" + id.String(),
            body: `{"title":"new","description":"d","completed":true}`,
            stubFunc: func(ctx context.Context, in usecase.UpdateTodoUsecaseInput) (model.Todo, error) {
                if in.ID != id || in.Title != "new" || in.Description == nil || *in.Description != "d" {
                    t.Fatalf("unexpected input: %+v", in)
                }
                return ret, nil
            },
            wantStatus: http.StatusOK,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubUpdateTodoUsecase) {
                var got UpdateTodoResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                if got.ID != id || got.Title != "new" || got.Completed != true {
                    t.Fatalf("unexpected response: %+v", got)
                }
            },
        },
        {
            name:       "bad id 400",
            path:       "/todos/bad",
            body:       `{"title":"x"}`,
            stubFunc:   nil,
            wantStatus: http.StatusBadRequest,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubUpdateTodoUsecase) {
                if stub.calls != 0 {
                    t.Fatalf("usecase should not be called")
                }
            },
        },
        {
            name:       "missing title 400",
            path:       "/todos/" + id.String(),
            body:       `{"description":"d"}`,
            stubFunc:   nil,
            wantStatus: http.StatusBadRequest,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubUpdateTodoUsecase) {
                if stub.calls != 0 {
                    t.Fatalf("usecase should not be called")
                }
            },
        },
        {
            name:       "not found 404",
            path:       "/todos/" + id.String(),
            body:       `{"title":"t"}`,
            stubFunc:   func(ctx context.Context, in usecase.UpdateTodoUsecaseInput) (model.Todo, error) { return model.Todo{}, repository.ErrRepositoryNotFound },
            wantStatus: http.StatusNotFound,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubUpdateTodoUsecase) {
                var herr httpErrorResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &herr); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                if herr.Message != "Todo not found" {
                    t.Fatalf("unexpected message: %q", herr.Message)
                }
            },
        },
    }

    for _, tc := range tcs {
        t.Run(tc.name, func(t *testing.T) {
            stub := &stubUpdateTodoUsecase{handleFunc: tc.stubFunc}
            h := NewUpdateTodoHandler(stub)
            e.PUT("/todos/:id", h.Handle)

            req := httptest.NewRequest(http.MethodPut, tc.path, strings.NewReader(tc.body))
            req.Header.Set("Content-Type", "application/json")
            rec := httptest.NewRecorder()
            e.ServeHTTP(rec, req)

            if rec.Code != tc.wantStatus {
                t.Fatalf("status: got %d want %d", rec.Code, tc.wantStatus)
            }
            if tc.assert != nil {
                tc.assert(t, rec, stub)
            }
        })
    }
}
