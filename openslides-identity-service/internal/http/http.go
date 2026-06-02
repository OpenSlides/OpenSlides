// Handles http requests
package http

import (
	"context"
	"fmt"
	"net"
	"net/http"

	"github.com/OpenSlides/openslides-go/environment"
)

const (
	prefixPublic   = "/system/identity"
	prefixInternal = "/internal/identity"
)

// Run starts the http server.
func RunHTTP(
	ctx context.Context,
) error {
	lookup := new(environment.ForProduction)
	mux := http.NewServeMux()
	id := NewIdentifier(lookup)

	HandleHealth(mux)
	HandleIdentity(mux, id)

	srv := &http.Server{
		Addr:        ":9014",
		Handler:     mux,
		BaseContext: func(net.Listener) context.Context { return ctx },
	}

	// Shutdown logic in separate goroutine.
	wait := make(chan error)
	go func() {
		<-ctx.Done()
		if err := srv.Shutdown(context.WithoutCancel(ctx)); err != nil {
			wait <- fmt.Errorf("HTTP server shutdown: %w", err)
			return
		}
		wait <- nil
	}()

	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		return fmt.Errorf("HTTP Server failed: %v", err)
	}

	return <-wait
}

// HandleHealth checks if the service is running
func HandleHealth(mux *http.ServeMux) {
	url := prefixPublic + "/health"
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"healthy": true, "service":"identity"}`)
	})

	mux.Handle(url, handler)
}

// HandleHealth returns the OS User ID from the auth header
func HandleIdentity(mux *http.ServeMux, id *Identity) {
	url := prefixPublic + "/get_id"
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		os_id, err := id.Identify(w, r)
		if err != nil {
			fmt.Fprintf(w, `{"error": %q}`, err.Error())
			return
		}

		fmt.Fprintf(w, `{"user_id": %d}`, os_id)
	})

	mux.Handle(url, handler)
}
