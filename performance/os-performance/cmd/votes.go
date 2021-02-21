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

	"github.com/OpenSlides/OpenSlides/performance/os-performace/client"
	"github.com/spf13/cobra"
	"github.com/vbauerster/mpb"
)

var (
	votesClients   int
	votesPollID    int
	votesOldURL    bool
	votesInterrupt bool
)

func init() {
	rootCmd.AddCommand(votesCmd)
	votesCmd.Flags().IntVarP(&votesClients, "amount", "a", 10, "Amount of users to use.")
	votesCmd.Flags().IntVarP(&votesPollID, "poll_id", "i", 1, "ID of the poll to use.")
	votesCmd.Flags().BoolVarP(&votesOldURL, "old_url", "o", false, "Use old url to python.")
	votesCmd.Flags().BoolVar(&votesInterrupt, "interrupt", false, "Wait for a user input after login")
}

var votesCmd = &cobra.Command{
	Use:   "votes",
	Short: "Sends many votes from different users",
	Long: `This command requires, that there are as many user as set via amount.
			The command "create_users" can be used to create the users.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		url := "https://%s/system/vote/motion/%d"
		if votesOldURL {
			url = "https://%s/rest/motions/motion-poll/%d/vote/"
		}

		url = fmt.Sprintf(url, domain, votesPollID)

		var clients []*client.Client
		for i := 0; i < votesClients; i++ {
			c, err := client.New(domain, fmt.Sprintf("dummy%d", i+1), "pass")
			if err != nil {
				return fmt.Errorf("creating client: %w", err)
			}
			clients = append(clients, c)
		}

		log.Printf("Login %d clients", votesClients)
		start := time.Now()
		var wgLogin sync.WaitGroup
		progress := mpb.New(mpb.WithWaitGroup(&wgLogin))
		loginBar := progress.AddBar(int64(votesClients))
		for i := 0; i < votesClients; i++ {
			wgLogin.Add(1)
			go func(c *client.Client) {
				defer wgLogin.Done()

				if err := c.Login(); err != nil {
					log.Printf("Error loging in client: %v", err)
					return
				}
				loginBar.Increment()
			}(clients[i])
		}
		progress.Wait()

		log.Printf("All clients logged in %v", time.Now().Sub(start))

		if votesInterrupt {
			reader := bufio.NewReader(os.Stdin)
			fmt.Println("Hit enter to continue")
			reader.ReadString('\n')
			log.Println("Starting voting")
		}

		start = time.Now()
		var wgVote sync.WaitGroup
		progress = mpb.New(mpb.WithWaitGroup(&wgVote))
		voteBar := progress.AddBar(int64(votesClients))
		for i := 0; i < votesClients; i++ {
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
		log.Printf("All Clients have voted in %v", time.Now().Sub(start))
		return nil
	},
}
