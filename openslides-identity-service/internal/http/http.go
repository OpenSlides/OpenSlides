// Handles http requests
package http

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
)

const (
	prefixPublic = "/system/identity"
)

// RunHTTP starts the http server.
func RunHTTP(ctx context.Context) error {
	port := os.Getenv("IDENTITY_PORT")
	if port == "" {
		port = "9014"
	}

	mux := http.NewServeMux()
	id := NewIdentifier()

	HandleHealth(mux)
	HandleIdentity(mux, id)

	srv := &http.Server{
		Addr:        ":" + port,
		Handler:     mux,
		BaseContext: func(net.Listener) context.Context { return ctx },
	}

	wait := make(chan error, 1)
	go func() {
		<-ctx.Done()
		if err := srv.Shutdown(context.WithoutCancel(ctx)); err != nil {
			wait <- fmt.Errorf("HTTP server shutdown: %w", err)
			return
		}
		wait <- nil
	}()

	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		return fmt.Errorf("HTTP server failed: %v", err)
	}

	return <-wait
}

// HandleHealth returns a simple health-check response.
func HandleHealth(mux *http.ServeMux) {
	mux.HandleFunc(prefixPublic+"/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"healthy": true, "service":"identity"}`)
	})
}

// HandleIdentity returns the OS user ID extracted from the Bearer token.
func HandleIdentity(mux *http.ServeMux, id *Identity) {
	mux.HandleFunc(prefixPublic+"/get_id", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		osID, err := id.Identify(w, r)
		if err != nil {
			fmt.Fprintf(w, `{"error": %q}`, err.Error())
			return
		}

		fmt.Fprintf(w, `{"user_id": %d}`, osID)
	})
}
