package handler

import (
	"backend_golang/application_service/usecase"
	"backend_golang/domain/repository"
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type UpdateTodoHandler struct {
	uu usecase.UpdateTodoUsecase
}

func NewUpdateTodoHandler(uu usecase.UpdateTodoUsecase) HTTPHandler {
	return &UpdateTodoHandler{
		uu: uu,
	}
}

type UpdateTodoRequest struct {
	ID          uuid.UUID `param:"id" validate:"required"`
	Title       string    `json:"title" validate:"required"`
	Description *string   `json:"description"`
}

type UpdateTodoResponse struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	Completed   bool      `json:"completed"`
}

func (h *UpdateTodoHandler) Handle(c echo.Context) error {
	var req UpdateTodoRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	todo, err := h.uu.Handle(c.Request().Context(), usecase.UpdateTodoUsecaseInput{
		ID:          req.ID,
		Title:       req.Title,
		Description: req.Description,
	})
	if err != nil {
		if errors.Is(err, repository.ErrRepositoryNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "Todo not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	t := todo.Serialize()
	return c.JSON(http.StatusOK, UpdateTodoResponse{
		ID:          t.ID,
		Title:       t.Title,
		Description: t.Description,
		Completed:   t.Completed,
	})
}
