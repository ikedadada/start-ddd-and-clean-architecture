package middleware

import (
    "encoding/json"
    "errors"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/labstack/echo/v4"
)

type httpErrorResponse struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

func TestErrorHandler(t *testing.T) {
    e := echo.New()

    tcs := []struct {
        name       string
        err        error
        wantStatus int
        assert     func(t *testing.T, rec *httptest.ResponseRecorder)
    }{
        {
            name:       "http error -> 400",
            err:        echo.NewHTTPError(http.StatusBadRequest, "bad request"),
            wantStatus: http.StatusBadRequest,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder) {
                var body httpErrorResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                if body.Code != http.StatusBadRequest || body.Message != "bad request" {
                    t.Fatalf("unexpected body: %+v", body)
                }
            },
        },
        {
            name:       "unknown error -> 500",
            err:        errors.New("boom"),
            wantStatus: http.StatusInternalServerError,
            assert: func(t *testing.T, rec *httptest.ResponseRecorder) {
                var body httpErrorResponse
                if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
                    t.Fatalf("invalid json: %v", err)
                }
                wantMsg := echo.ErrInternalServerError.Message.(string)
                if body.Code != http.StatusInternalServerError || body.Message != wantMsg {
                    t.Fatalf("unexpected body: %+v", body)
                }
            },
        },
    }

    for _, tc := range tcs {
        t.Run(tc.name, func(t *testing.T) {
            req := httptest.NewRequest(http.MethodGet, "/", nil)
            rec := httptest.NewRecorder()
            c := e.NewContext(req, rec)

            ErrorHandler(tc.err, c)

            if rec.Code != tc.wantStatus {
                t.Fatalf("status: got %d want %d", rec.Code, tc.wantStatus)
            }
            if tc.assert != nil {
                tc.assert(t, rec)
            }
        })
    }
}
