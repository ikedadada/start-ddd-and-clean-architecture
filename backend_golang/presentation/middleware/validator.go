package middleware

import (
	"github.com/go-playground/validator/v10"
)

type Validator struct {
	v *validator.Validate
}

func NewValidator() *Validator {
	v := validator.New()
	// Add custom validations here if needed
	return &Validator{
		v: v,
	}
}

func (cv *Validator) Validate(i interface{}) error {
	return cv.v.Struct(i)
}
