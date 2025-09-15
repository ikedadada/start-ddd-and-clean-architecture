package handler

import (
	"backend_golang/application_service/usecase"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type CreateTodoHandler struct {
	cu usecase.CreateTodoUsecase
}

func NewCreateTodoHandler(cu usecase.CreateTodoUsecase) HTTPHandler {
	return &CreateTodoHandler{
		cu: cu,
	}
}

type CreateTodoRequest struct {
	Title       string  `json:"title" validate:"required"`
	Description *string `json:"description"`
}

type CreateTodoResponse struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	Completed   bool      `json:"completed"`
}

func (h *CreateTodoHandler) Handle(c echo.Context) error {
	var req CreateTodoRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	todo, err := h.cu.Handle(c.Request().Context(), usecase.CreateTodoUsecaseInput{
		Title:       req.Title,
		Description: req.Description,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	t := todo.Serialize()

	return c.JSON(http.StatusCreated, CreateTodoResponse{
		ID:          t.ID,
		Title:       t.Title,
		Description: t.Description,
		Completed:   t.Completed,
	})
}
