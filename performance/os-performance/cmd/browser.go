package cmd

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/OpenSlides/OpenSlides/performance/os-performace/client"
	"github.com/spf13/cobra"
	"github.com/vbauerster/mpb"
)

var (
	browserClients int
)

const (
	pathLogin      = "/apps/users/login/"
	pathWhoami     = "/apps/users/whoami/"
	pathServertime = "/apps/core/servertime/"
	pathConstants  = "/apps/core/constants/"
)

func init() {
	rootCmd.AddCommand(browserCmd)
	browserCmd.Flags().IntVarP(&browserClients, "amount", "a", 10, "Amount of users to use.")
}

var browserCmd = &cobra.Command{
	Use:   "browser",
	Short: "Simulates that a user logs in and opens the browser",
	Long: `After a login, the OpenSlides-Client sends 4 Requests agains the backend.
			Whoami, login, constants, servertime.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		log.Printf("using %d clients to %s", browserClients, domain)

		wg := new(sync.WaitGroup)
		progress := mpb.New(mpb.WithWaitGroup(wg))
		bar := progress.AddBar(int64(browserClients) * 5)

		clients := make([]*client.Client, browserClients)
		for i := range clients {
			c, err := client.New(domain, username, password)
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
				if err := browser(c, bar); err != nil {
					log.Printf("Client failed: %v", err)
				}
			}(c)
		}

		progress.Wait()
		log.Printf("Run for %v", time.Now().Sub(start))
		return nil
	},
}

func browser(c *client.Client, bar *mpb.Bar) error {
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
