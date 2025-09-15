package middleware

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
)

type HTTPErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func ErrorHandler(err error, c echo.Context) {
	var ee *echo.HTTPError
	if errors.As(err, &ee) {
		c.JSON(ee.Code, HTTPErrorResponse{
			Code:    ee.Code,
			Message: ee.Message.(string),
		})
		return
	}
	c.JSON(http.StatusInternalServerError, HTTPErrorResponse{
		Code:    echo.ErrInternalServerError.Code,
		Message: echo.ErrInternalServerError.Message.(string),
	})
}
