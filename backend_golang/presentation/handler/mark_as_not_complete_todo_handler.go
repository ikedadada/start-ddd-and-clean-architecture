package handler

import (
	"backend_golang/application_service/usecase"
	"backend_golang/domain/model"
	"backend_golang/domain/repository"
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type MarkAsNotCompleteTodoHandler struct {
	mu usecase.MarkAsNotCompleteTodoUsecase
}

func NewMarkAsNotCompleteTodoHandler(mu usecase.MarkAsNotCompleteTodoUsecase) HTTPHandler {
	return &MarkAsNotCompleteTodoHandler{
		mu: mu,
	}
}

type MarkAsNotCompleteTodoRequest struct {
	ID uuid.UUID `param:"id" validate:"required"`
}

type MarkAsNotCompleteTodoResponse struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	Completed   bool      `json:"completed"`
}

func (h *MarkAsNotCompleteTodoHandler) Handle(c echo.Context) error {
	var req MarkAsNotCompleteTodoRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	todo, err := h.mu.Handle(c.Request().Context(), req.ID)
	if err != nil {
		if errors.Is(err, model.ErrTodoNotCompleted) {
			return echo.NewHTTPError(http.StatusConflict, "Todo not completed")
		}
		if errors.Is(err, repository.ErrRepositoryNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "Todo not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	t := todo.Serialize()
	return c.JSON(http.StatusOK, MarkAsNotCompleteTodoResponse{
		ID:          t.ID,
		Title:       t.Title,
		Description: t.Description,
		Completed:   t.Completed,
	})
}
