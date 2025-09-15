package presentation

import (
	"backend_golang/application_service/usecase"
	"backend_golang/infrastructure"
	"backend_golang/infrastructure/repository"
	"backend_golang/infrastructure/service"
	"backend_golang/presentation/handler"
	"backend_golang/presentation/middleware"
	"context"
	"os"
	"os/signal"
	"time"

	"github.com/labstack/echo/v4"
	echo_middleware "github.com/labstack/echo/v4/middleware"
)

type Server struct {
	echo *echo.Echo
	db   *infrastructure.DB
}

func NewServer() *Server {
	// Echo instance
	e := echo.New()

	// Middleware
	e.Use(echo_middleware.Logger())
	e.Use(echo_middleware.Recover())
	e.Validator = middleware.NewValidator()
	e.HTTPErrorHandler = middleware.ErrorHandler

	db := infrastructure.NewDB()

	s := &Server{
		echo: e,
		db:   db,
	}

	s.setupRoutes()

	return s
}

func (s *Server) setupRoutes() {

	tr := repository.NewTodoRepository(s.db)
	ts := service.NewTransactionService(s.db)

	cu := usecase.NewCreateTodoUsecase(tr)
	ga := usecase.NewGetAllTodosUsecase(tr)
	gt := usecase.NewGetTodoUsecase(tr)
	ut := usecase.NewUpdateTodoUsecase(tr, ts)
	mac := usecase.NewMarkAsCompleteTodoUsecase(tr, ts)
	manc := usecase.NewMarkAsNotCompleteTodoUsecase(tr, ts)
	dt := usecase.NewDeleteTodoUsecase(tr, ts)

	s.echo.GET("/health", func(c echo.Context) error {
		return c.String(200, "OK")
	})

	s.echo.POST("/todos", handler.NewCreateTodoHandler(cu).Handle)
	s.echo.GET("/todos", handler.NewGetAllTodosHandler(ga).Handle)
	s.echo.GET("/todos/:id", handler.NewGetTodoHandler(gt).Handle)
	s.echo.PUT("/todos/:id", handler.NewUpdateTodoHandler(ut).Handle)
	s.echo.PUT("/todos/:id/complete", handler.NewMarkAsCompleteTodoHandler(mac).Handle)
	s.echo.PUT("/todos/:id/uncomplete", handler.NewMarkAsNotCompleteTodoHandler(manc).Handle)
	s.echo.DELETE("/todos/:id", handler.NewDeleteTodoHandler(dt).Handle)
}

func (s *Server) Start(address string) {
	defer s.db.Close()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	go func() {
		if err := s.echo.Start(address); err != nil {
			s.echo.Logger.Info("shutting down the server")
		}
	}()

	<-ctx.Done()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := s.echo.Shutdown(ctx); err != nil {
		s.echo.Logger.Fatal(err)
	}
}
