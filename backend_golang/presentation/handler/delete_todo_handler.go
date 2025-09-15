package handler

import (
	"backend_golang/application_service/usecase"
	"backend_golang/domain/repository"
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type DeleteTodoHandler struct {
	du usecase.DeleteTodoUsecase
}

func NewDeleteTodoHandler(du usecase.DeleteTodoUsecase) HTTPHandler {
	return &DeleteTodoHandler{
		du: du,
	}
}

type DeleteTodoRequest struct {
	ID uuid.UUID `param:"id" validate:"required"`
}

func (h *DeleteTodoHandler) Handle(c echo.Context) error {
	var req DeleteTodoRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	err := h.du.Handle(c.Request().Context(), req.ID)
	if err != nil {
		if errors.Is(err, repository.ErrRepositoryNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "Todo not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}
