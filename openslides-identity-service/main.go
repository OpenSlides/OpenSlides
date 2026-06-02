package main

import (
	"context"
	"fmt"
	"io"
	gohttp "net/http"
	"strings"

	"github.com/OpenSlides/openslides-go/environment"
)

var (
	envIdentityPort = environment.NewVariable("IDENTITY_PORT", "9014", "Port on which the service listen on.")
)

func main() {
	ctx, cancel := environment.InterruptContext()
	defer cancel()

	run(ctx)

	health(ctx)
}

func run(ctx context.Context) error {
	return nil
}

func health(ctx context.Context) error {
	lookup := new(environment.ForProduction)

	req, err := gohttp.NewRequestWithContext(ctx, "GET", "http://localhost:"+envIdentityPort.Value(lookup)+"/system/identity/health", nil)
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}

	resp, err := gohttp.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("sending request: %w", err)
	}

	if resp.StatusCode != 200 {
		return fmt.Errorf("health returned status %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("reading response body: %w", err)
	}

	expect := `{"healthy": true, "service":"identity"}`
	got := strings.TrimSpace(string(body))
	if got != expect {
		return fmt.Errorf("got `%s`, expected `%s`", body, expect)
	}

	return nil
}
