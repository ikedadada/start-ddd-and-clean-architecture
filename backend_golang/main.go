package main

import (
	"backend_golang/presentation"
)

func main() {
	s := presentation.NewServer()
	s.Start(":3000")
}
