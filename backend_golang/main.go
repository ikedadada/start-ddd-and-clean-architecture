package main

import (
	"backend_golang/presentation"
	"os"
)

func main() {
	s := presentation.NewServer()
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	s.Start(":" + port)
}
