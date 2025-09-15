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

type stubGetTodoUsecase struct {
    handleFunc func(ctx context.Context, id uuid.UUID) (model.Todo, error)
    calls      int
}

var _ usecase.GetTodoUsecase = (*stubGetTodoUsecase)(nil)

func (s *stubGetTodoUsecase) Handle(ctx context.Context, id uuid.UUID) (model.Todo, error) {
    s.calls++
    if s.handleFunc != nil {
        return s.handleFunc(ctx, id)
    }
    return model.Todo{}, nil
}

func TestGetTodoHandler(t *testing.T) {
    e := newEcho()
    desc := "d"
    ret := model.DeserializeTodo(model.SerializedTodo{ID: uuid.New(), Title: "a", Description: &desc, Completed: false})
    validPath := "/todos/" + ret.Serialize().ID.String()

    tcs := []struct {
        name       string
        path       string
        stubFunc   func(ctx context.Context, id uuid.UUID) (model.Todo, error)
        wantStatus int
        assert     func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubGetTodoUsecase)
    }{
        {
            name: "success 200",
            path: validPath,
            stubFunc: func(ctx context.Context, id uuid.UUID) (model.Todo, error) {
                if id != ret.Serialize().ID {
                    t.Fatalf("unexpected id")
                }
                return ret, nil
            },
            wantStatus: http.StatusOK,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubGetTodoUsecase) {
                var got GetTodoResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                if got.ID != ret.Serialize().ID || got.Title != "a" || got.Completed != false {
                    t.Fatalf("unexpected response: %+v", got)
                }
            },
        },
        {
            name:       "bad id 400",
            path:       "/todos/bad",
            stubFunc:   nil,
            wantStatus: http.StatusBadRequest,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubGetTodoUsecase) {
                if stub.calls != 0 {
                    t.Fatalf("usecase should not be called")
                }
            },
        },
        {
            name:       "not found 404",
            path:       "/todos/" + uuid.New().String(),
            stubFunc:   func(ctx context.Context, _ uuid.UUID) (model.Todo, error) { return model.Todo{}, repository.ErrRepositoryNotFound },
            wantStatus: http.StatusNotFound,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubGetTodoUsecase) {
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
            stub := &stubGetTodoUsecase{handleFunc: tc.stubFunc}
            h := NewGetTodoHandler(stub)
            e.GET("/todos/:id", h.Handle)

            req := httptest.NewRequest(http.MethodGet, tc.path, nil)
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
