package service

import (
    "backend_golang/infrastructure"
    "context"
    "errors"
    "testing"
)

func TestTransactionService_Run(t *testing.T) {
    type ctxKey struct{}
    key := ctxKey{}

    tcs := []struct {
        name       string
        setupCtx   func() context.Context
        fn         func(ctx context.Context) error
        wantErr    bool
        assert     func(t *testing.T, ran bool, err error)
    }{
        {
            name: "success",
            setupCtx: func() context.Context {
                return context.WithValue(context.Background(), key, "v")
            },
            fn: func(inner context.Context) error {
                if inner.Value(key) != "v" {
                    t.Fatalf("context value not propagated")
                }
                return nil
            },
            wantErr: false,
            assert: func(t *testing.T, ran bool, err error) {
                if err != nil {
                    t.Fatalf("unexpected error: %v", err)
                }
                if !ran {
                    t.Fatalf("callback was not executed")
                }
            },
        },
        {
            name:     "returns error",
            setupCtx: func() context.Context { return context.Background() },
            fn: func(ctx context.Context) error {
                return errors.New("boom")
            },
            wantErr: true,
            assert: func(t *testing.T, ran bool, err error) {
                if err == nil || err.Error() != "boom" {
                    t.Fatalf("expected boom error, got %v", err)
                }
                if !ran {
                    t.Fatalf("callback should run even when returning error")
                }
            },
        },
        {
            name:     "recovers panic",
            setupCtx: func() context.Context { return context.Background() },
            fn: func(ctx context.Context) error {
                panic("oops")
            },
            wantErr: true,
            assert: func(t *testing.T, ran bool, err error) {
                if err == nil {
                    t.Fatalf("expected error from recovered panic, got nil")
                }
                // ran becomes true because we set it right before invoking fn
                if !ran {
                    t.Fatalf("callback marker not set")
                }
            },
        },
    }

    for _, tc := range tcs {
        t.Run(tc.name, func(t *testing.T) {
            db := infrastructure.NewTestDB(t)
            s := NewTransactionService(db)
            ctx := tc.setupCtx()

            ran := false
            err := s.Run(ctx, func(inner context.Context) error {
                ran = true
                return tc.fn(inner)
            })

            if tc.assert != nil {
                tc.assert(t, ran, err)
            }
        })
    }
}
