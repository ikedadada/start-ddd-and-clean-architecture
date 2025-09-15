package model

import "github.com/google/uuid"

func newID() uuid.UUID {
	id, err := uuid.NewV7()
	if err != nil {
		panic(err)
	}
	return id
}
