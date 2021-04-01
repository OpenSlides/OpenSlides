package cmd

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/OpenSlides/OpenSlides/performance/client"
	"github.com/spf13/cobra"
	"github.com/vbauerster/mpb"
)

const browserHelp = `Browser simulates that a user opens a browser tab.

First, a login request is send to teh server. After the user is authenticated,
it sends 4 requests to the backend at the same time:
* whoami
* a get request to login
* constants
* servertime

This command tests only the python backend. The requests to the autoupdate-service
are skipped for this test. Use the "connect" command to test the autoupdate-service.`

const (
	pathLogin      = "/apps/users/login/"
	pathWhoami     = "/apps/users/whoami/"
	pathServertime = "/apps/core/servertime/"
	pathConstants  = "/apps/core/constants/"
)

func cmdBrowser(cfg *config) *cobra.Command {
	var clientCount int

	cmd := &cobra.Command{
		Use:   "browser",
		Short: "Simulates that a user logs in and opens the browser",
		Long:  browserHelp,
		RunE: func(cmd *cobra.Command, args []string) error {
			log.Printf("using %d clients to %s", clientCount, cfg.domain)

			wg := new(sync.WaitGroup)
			progress := mpb.New(mpb.WithWaitGroup(wg))
			bar := progress.AddBar(int64(clientCount) * 5)

			clients := make([]*client.Client, clientCount)
			for i := range clients {
				c, err := client.New(cfg.domain, cfg.username, cfg.password)
				if err != nil {
					return fmt.Errorf("creating client: %w", err)
				}
				clients[i] = c
			}

			start := time.Now()

			for _, c := range clients {
				wg.Add(1)
				go func(c *client.Client) {
					defer wg.Done()
					if err := browser(cfg.domain, c, bar); err != nil {
						log.Printf("Client failed: %v", err)
					}
				}(c)
			}

			progress.Wait()
			log.Printf("Run for %v", time.Now().Sub(start))
			return nil
		},
	}

	cmd.Flags().IntVarP(&clientCount, "amount", "a", 10, "Amount of users to use.")
	return cmd
}

func browser(domain string, c *client.Client, bar *mpb.Bar) error {
	if err := c.Login(); err != nil {
		return fmt.Errorf("login client: %w", err)
	}
	bar.Increment()

	var wg sync.WaitGroup

	for _, path := range []string{
		pathWhoami,
		pathLogin,
		pathServertime,
		pathConstants,
	} {
		wg.Add(1)
		go func(path string) {
			defer wg.Done()

			req, err := http.NewRequest("GET", "https://"+domain+path, nil)
			if err != nil {
				log.Printf("Error creating request: %v", err)
				return
			}

			if _, err := c.Do(req); err != nil {
				log.Printf("Error get request to %s: %v", path, err)
				return
			}
			bar.Increment()
		}(path)
	}

	wg.Wait()
	return nil
}
