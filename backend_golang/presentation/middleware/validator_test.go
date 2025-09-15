package middleware

import (
	"testing"

	"github.com/google/uuid"
)

type uuidSample struct {
	ID *uuid.UUID `validate:"required"`
}

func TestValidator_UUID(t *testing.T) {
	v := NewValidator()
	testId := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
	tcs := []struct {
		name string
		id   *uuid.UUID
		ok   bool
	}{
		{name: "valid", id: &testId, ok: true},
		{name: "nil", id: nil, ok: false},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			s := uuidSample{ID: tc.id}
			err := v.Validate(s)
			if tc.ok && err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
			if !tc.ok && err == nil {
				t.Fatalf("expected error, got nil")
			}
		})
	}
}
