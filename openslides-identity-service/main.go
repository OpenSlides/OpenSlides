package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	oshttp "github.com/OpenSlides/openslides-identity-service/internal/http"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	if err := oshttp.RunHTTP(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
