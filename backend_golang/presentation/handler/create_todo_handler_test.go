package handler

import (
    "backend_golang/application_service/usecase"
    "backend_golang/domain/model"
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"

    "github.com/google/uuid"
)

type stubCreateTodoUsecase struct {
    handleFunc func(ctx context.Context, input usecase.CreateTodoUsecaseInput) (model.Todo, error)
    calls      int
    lastInput  usecase.CreateTodoUsecaseInput
}

var _ usecase.CreateTodoUsecase = (*stubCreateTodoUsecase)(nil)

func (s *stubCreateTodoUsecase) Handle(ctx context.Context, input usecase.CreateTodoUsecaseInput) (model.Todo, error) {
    s.calls++
    s.lastInput = input
    if s.handleFunc != nil {
        return s.handleFunc(ctx, input)
    }
    return model.NewTodo(input.Title, input.Description), nil
}

func TestCreateTodoHandler(t *testing.T) {
    e := newEcho()
    desc := "desc"
    ret := model.DeserializeTodo(model.SerializedTodo{
        ID:          uuid.New(),
        Title:       "title",
        Description: &desc,
        Completed:   false,
    })

    tcs := []struct {
        name       string
        body       string
        stubFunc   func(ctx context.Context, in usecase.CreateTodoUsecaseInput) (model.Todo, error)
        wantStatus int
        assert     func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubCreateTodoUsecase)
    }{
        {
            name: "success 201",
            body: `{"title":"title","description":"desc"}`,
            stubFunc: func(ctx context.Context, in usecase.CreateTodoUsecaseInput) (model.Todo, error) {
                if in.Title != "title" {
                    t.Fatalf("unexpected title: %q", in.Title)
                }
                if in.Description == nil || *in.Description != "desc" {
                    t.Fatalf("unexpected description: %v", in.Description)
                }
                return ret, nil
            },
            wantStatus: http.StatusCreated,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubCreateTodoUsecase) {
                var got CreateTodoResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                if got.ID != ret.Serialize().ID || got.Title != "title" || got.Completed != false {
                    t.Fatalf("unexpected response: %+v", got)
                }
            },
        },
        {
            name:       "bad request when title missing",
            body:       `{}`,
            stubFunc:   nil,
            wantStatus: http.StatusBadRequest,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder, stub *stubCreateTodoUsecase) {
                if stub.calls != 0 {
                    t.Fatalf("usecase should not be called, got %d", stub.calls)
                }
            },
        },
    }

    for _, tc := range tcs {
        t.Run(tc.name, func(t *testing.T) {
            stub := &stubCreateTodoUsecase{handleFunc: tc.stubFunc}
            h := NewCreateTodoHandler(stub)
            e.POST("/todos", h.Handle)

            req := httptest.NewRequest(http.MethodPost, "/todos", strings.NewReader(tc.body))
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
