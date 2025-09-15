package handler

import "github.com/labstack/echo/v4"

type HTTPHandler interface {
	Handle(c echo.Context) error
}
