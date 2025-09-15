package infrastructure

import (
	"context"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type DB struct {
	*gorm.DB
}

func NewDB() *DB {
	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	return &DB{db}
}

type TxKey string

const txKey TxKey = "auth_tx"

func WithTx(ctx context.Context, tx *gorm.DB) context.Context {
	return context.WithValue(ctx, txKey, tx)
}

func (d *DB) Conn(ctx context.Context) *gorm.DB {
	tx, ok := ctx.Value(txKey).(*gorm.DB)
	if ok && tx != nil {
		return tx
	}
	return d.DB.Session(&gorm.Session{})
}

func (d *DB) Close() {
	if d == nil || d.DB == nil {
		return
	}
	sqlDB, err := d.DB.DB()
	if err != nil {
		return
	}
	sqlDB.Close()
}
