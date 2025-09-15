package infrastructure

import (
	"testing"

	"backend_golang/infrastructure/repository/data_model"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func NewTestDB(t *testing.T) *DB {
	t.Helper()
	dsn := "file:" + t.Name() + "?mode=memory&cache=shared"
	gdb, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	db := &DB{DB: gdb}
	if err := db.AutoMigrate(&data_model.Todo{}); err != nil {
		t.Fatalf("auto migrate failed: %v", err)
	}
	return db
}
