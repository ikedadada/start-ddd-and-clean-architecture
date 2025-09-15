package handler

import (
    "backend_golang/application_service/usecase"
    "backend_golang/domain/repository"
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/google/uuid"
)

// stubDeleteTodoUsecase is a simple stub for usecase.DeleteTodoUsecase
type stubDeleteTodoUsecase struct {
    handleFunc func(ctx context.Context, id uuid.UUID) error
    calls      int
}

var _ usecase.DeleteTodoUsecase = (*stubDeleteTodoUsecase)(nil)

func (s *stubDeleteTodoUsecase) Handle(ctx context.Context, id uuid.UUID) error {
    s.calls++
    if s.handleFunc != nil {
        return s.handleFunc(ctx, id)
    }
    return nil
}

func TestDeleteTodoHandler(t *testing.T) {
    e := newEcho()
    id := uuid.New()

    tcs := []struct {
        name       string
        path       string
        stubFunc   func(ctx context.Context, got uuid.UUID) error
        wantStatus int
        assertBody func(t *testing.T, rec *httptest.ResponseRecorder)
        wantCalls  int
    }{
        {
            name: "success 204",
            path: "/todos/" + id.String(),
            stubFunc: func(ctx context.Context, got uuid.UUID) error {
                if got != id {
                    t.Fatalf("unexpected id: got %s want %s", got, id)
                }
                return nil
            },
            wantStatus: http.StatusNoContent,
            assertBody: func(t *testing.T, rec *httptest.ResponseRecorder) {
                if rec.Body.Len() != 0 {
                    t.Fatalf("expected empty body, got %q", rec.Body.String())
                }
            },
            wantCalls: 1,
        },
        {
            name:       "bad id 400",
            path:       "/todos/bad",
            stubFunc:   nil,
            wantStatus: http.StatusBadRequest,
            assertBody: func(t *testing.T, rec *httptest.ResponseRecorder) {
                var herr httpErrorResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &herr); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                if herr.Code != http.StatusBadRequest || herr.Message == "" {
                    t.Fatalf("unexpected error body: %+v", herr)
                }
            },
            wantCalls: 0,
        },
        {
            name: "not found 404",
            path: "/todos/" + id.String(),
            stubFunc: func(ctx context.Context, got uuid.UUID) error {
                return repository.ErrRepositoryNotFound
            },
            wantStatus: http.StatusNotFound,
            assertBody: func(t *testing.T, rec *httptest.ResponseRecorder) {
                var herr httpErrorResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &herr); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                if herr.Code != http.StatusNotFound || herr.Message != "Todo not found" {
                    t.Fatalf("unexpected error body: %+v", herr)
                }
            },
            wantCalls: 1,
        },
    }

    for _, tc := range tcs {
        t.Run(tc.name, func(t *testing.T) {
            stub := &stubDeleteTodoUsecase{handleFunc: tc.stubFunc}
            h := NewDeleteTodoHandler(stub)
            e.DELETE("/todos/:id", h.Handle)

            req := httptest.NewRequest(http.MethodDelete, tc.path, nil)
            rec := httptest.NewRecorder()
            e.ServeHTTP(rec, req)

            if rec.Code != tc.wantStatus {
                t.Fatalf("status: got %d want %d", rec.Code, tc.wantStatus)
            }
            if tc.assertBody != nil {
                tc.assertBody(t, rec)
            }
            if stub.calls != tc.wantCalls {
                t.Fatalf("usecase calls: got %d want %d", stub.calls, tc.wantCalls)
            }
        })
    }
}
