package handler

import (
	"backend_golang/presentation/middleware"

	"github.com/labstack/echo/v4"
)

type httpErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func newEcho() *echo.Echo {
	e := echo.New()
	e.Validator = middleware.NewValidator()
	e.HTTPErrorHandler = middleware.ErrorHandler
	return e
}
