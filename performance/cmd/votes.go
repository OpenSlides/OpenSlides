package cmd

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/OpenSlides/OpenSlides/performance/client"
	"github.com/spf13/cobra"
	"github.com/vbauerster/mpb"
)

const voteHelp = `Sends many votes from different users.

This command requires, that there are many user created at the
backend. You can use the command "create_users" for this job.

Per default, the command uses the new url to the autoupdate-service.
To test the url from the python-server, you can use the flag "old_url".`

func cmdVotes(cfg *config) *cobra.Command {
	var (
		count      int
		pollID     int
		oldURL     bool
		interrupt  bool
		loginRetry int
	)

	cmd := &cobra.Command{
		Use:   "votes",
		Short: "Sends many votes from different users",
		Long:  voteHelp,
		RunE: func(cmd *cobra.Command, args []string) error {
			url := "https://%s/system/vote/motion/%d"
			if oldURL {
				url = "https://%s/rest/motions/motion-poll/%d/vote/"
			}
			url = fmt.Sprintf(url, cfg.domain, pollID)

			return sendVotes(url, cfg.domain, count, interrupt, loginRetry)
		},
	}

	cmd.Flags().IntVarP(&count, "amount", "a", 10, "Amount of users to use.")
	cmd.Flags().IntVarP(&pollID, "poll_id", "i", 1, "ID of the poll to use.")
	cmd.Flags().BoolVarP(&oldURL, "old_url", "o", false, "Use old url to python.")
	cmd.Flags().BoolVar(&interrupt, "interrupt", false, "Wait for a user input after login.")
	cmd.Flags().IntVarP(&loginRetry, "login_retry", "r", 3, "Retries send login requests before returning an error.")

	return cmd
}

func sendVotes(url string, domain string, count int, interrupt bool, loginRetry int) error {
	var clients []*client.Client
	for i := 0; i < count; i++ {
		c, err := client.New(domain, fmt.Sprintf("dummy%d", i+1), "pass", client.WithLoginRetry(loginRetry))
		if err != nil {
			return fmt.Errorf("creating client: %w", err)
		}
		clients = append(clients, c)
	}

	log.Printf("Login %d clients", count)
	start := time.Now()
	massLogin(clients, loginRetry)
	log.Printf("All clients logged in %v", time.Now().Sub(start))

	if interrupt {
		reader := bufio.NewReader(os.Stdin)
		fmt.Println("Hit enter to continue")
		reader.ReadString('\n')
		log.Println("Starting voting")
	}

	start = time.Now()
	massVotes(clients, url)
	log.Printf("All Clients have voted in %v", time.Now().Sub(start))
	return nil
}

func massLogin(clients []*client.Client, tries int) {
	var wgLogin sync.WaitGroup
	progress := mpb.New(mpb.WithWaitGroup(&wgLogin))
	loginBar := progress.AddBar(int64(len(clients)))

	for i := 0; i < len(clients); i++ {
		wgLogin.Add(1)
		go func(c *client.Client) {
			defer wgLogin.Done()

			if err := c.Login(); err != nil {
				log.Printf("Login failed: %v", err)
				return
			}

			loginBar.Increment()
		}(clients[i])
	}
	progress.Wait()
}

func massVotes(clients []*client.Client, url string) {
	var wgVote sync.WaitGroup
	progress := mpb.New(mpb.WithWaitGroup(&wgVote))
	voteBar := progress.AddBar(int64(len(clients)))
	for i := 0; i < len(clients); i++ {
		wgVote.Add(1)
		go func(c *client.Client) {
			defer wgVote.Done()

			body := `{"data":"Y"}`
			req, err := http.NewRequest("POST", url, strings.NewReader(body))
			if err != nil {
				log.Printf("Error creating request: %v", err)
				return
			}

			req.Header.Set("Content-Type", "application/json")

			if _, err := client.CheckStatus(c.Do(req)); err != nil {
				log.Printf("Error sending vote request: %v", err)
				return
			}

			voteBar.Increment()
			return
		}(clients[i])
	}
	progress.Wait()
}
