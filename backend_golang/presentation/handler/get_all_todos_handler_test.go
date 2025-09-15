package handler

import (
	"backend_golang/application_service/usecase"
	"backend_golang/domain/model"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
)

type stubGetAllTodosUsecase struct {
	handleFunc func(ctx context.Context) ([]model.Todo, error)
	calls      int
}

var _ usecase.GetAllTodosUsecase = (*stubGetAllTodosUsecase)(nil)

func (s *stubGetAllTodosUsecase) Handle(ctx context.Context) ([]model.Todo, error) {
	s.calls++
	if s.handleFunc != nil {
		return s.handleFunc(ctx)
	}
	return nil, nil
}

func TestGetAllTodosHandler(t *testing.T) {
	e := newEcho()
	desc := "d"
	t1 := model.DeserializeTodo(model.SerializedTodo{ID: uuid.New(), Title: "a", Description: &desc, Completed: false})
	t2 := model.DeserializeTodo(model.SerializedTodo{ID: uuid.New(), Title: "b", Description: nil, Completed: true})

	tcs := []struct {
		name       string
		stubFunc   func(ctx context.Context) ([]model.Todo, error)
		wantStatus int
		assert     func(t *testing.T, rec *httptest.ResponseRecorder)
	}{
		{
			name: "success 200",
			stubFunc: func(ctx context.Context) ([]model.Todo, error) {
				return []model.Todo{t1, t2}, nil
			},
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rec *httptest.ResponseRecorder) {
				var got GetAllTodosResponse
				if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
					t.Fatalf("invalid json: %v", err)
				}
				if len(got.Todos) != 2 {
					t.Fatalf("unexpected todos len: %d", len(got.Todos))
				}
				if got.Todos[0].ID != t1.Serialize().ID || got.Todos[1].ID != t2.Serialize().ID {
					t.Fatalf("unexpected ids: %+v", got)
				}
			},
		},
		{
			name: "usecase error -> 500",
			stubFunc: func(ctx context.Context) ([]model.Todo, error) {
				return nil, errors.New("boom")
			},
			wantStatus: http.StatusInternalServerError,
			assert: func(t *testing.T, rec *httptest.ResponseRecorder) {
				var errRes httpErrorResponse
				if err := json.Unmarshal(rec.Body.Bytes(), &errRes); err != nil {
					t.Fatalf("invalid json: %v", err)
				}
				if errRes.Code != http.StatusInternalServerError || errRes.Message != "boom" {
					t.Fatalf("unexpected error body: %+v", errRes)
				}
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			stub := &stubGetAllTodosUsecase{handleFunc: tc.stubFunc}
			h := NewGetAllTodosHandler(stub)
			e.GET("/todos", h.Handle)

			req := httptest.NewRequest(http.MethodGet, "/todos", nil)
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
