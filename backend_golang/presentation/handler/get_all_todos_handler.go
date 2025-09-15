package handler

import (
	"backend_golang/application_service/usecase"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type GetAllTodosHandler struct {
	au usecase.GetAllTodosUsecase
}

func NewGetAllTodosHandler(au usecase.GetAllTodosUsecase) HTTPHandler {
	return &GetAllTodosHandler{
		au: au,
	}
}

type GetAllTodosTodoDTO struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	Completed   bool      `json:"completed"`
}

type GetAllTodosResponse struct {
	Todos []GetAllTodosTodoDTO `json:"todos"`
}

func (h *GetAllTodosHandler) Handle(c echo.Context) error {
	todos, err := h.au.Handle(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	response := GetAllTodosResponse{
		Todos: make([]GetAllTodosTodoDTO, len(todos)),
	}
	for i, todo := range todos {
		t := todo.Serialize()
		response.Todos[i] = GetAllTodosTodoDTO{
			ID:          t.ID,
			Title:       t.Title,
			Description: t.Description,
			Completed:   t.Completed,
		}
	}
	return c.JSON(http.StatusOK, response)
}
