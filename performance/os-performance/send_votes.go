package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/vbauerster/mpb/v6"
)

func runVotes(ctx context.Context, cfg *Config) error {
	progress := mpb.New()
	bar := progress.AddBar(int64(cfg.clientCount))

	var wg sync.WaitGroup

	for i := 0; i < cfg.clientCount; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()

			c, err := newClient(cfg.domain, fmt.Sprintf("dummy%d", i+1), "pass", bar)
			if err != nil {
				log.Printf("Error creating client: %v", err)
				return
			}

			if err := c.login(); err != nil {
				log.Printf("Error loging in client: %v", err)
				return
			}

			body := `{"data":"Y"}`
			req, err := http.NewRequestWithContext(ctx, "POST", "https://"+cfg.domain+"/system/vote/motion/1", strings.NewReader(body))
			if err != nil {
				log.Printf("Error creating request: %v", err)
				return
			}

			if _, err := checkStatus(c.Do(req)); err != nil {
				log.Printf("Error sending vote request: %v", err)
				return
			}
			return
		}(i)
	}

	wg.Wait()
	return nil
}
