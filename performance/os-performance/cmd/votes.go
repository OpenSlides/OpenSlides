package cmd

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/OpenSlides/OpenSlides/performance/os-performace/client"
	"github.com/spf13/cobra"
	"github.com/vbauerster/mpb"
)

var (
	votesClients int
	votesPollID  int
)

func init() {
	rootCmd.AddCommand(votesCmd)
	votesCmd.Flags().IntVarP(&votesClients, "amount", "a", 10, "Amount of users to use.")
	votesCmd.Flags().IntVarP(&votesPollID, "poll_id", "i", 1, "ID of the poll to use.")
}

var votesCmd = &cobra.Command{
	Use:   "votes",
	Short: "Sends many votes from different users",
	Long: `This command requires, that there are as many user as set via amount.
			The command "create_users" can be used to create the users.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		wg := new(sync.WaitGroup)
		progress := mpb.New(mpb.WithWaitGroup(wg))
		bar := progress.AddBar(int64(votesClients))

		for i := 0; i < votesClients; i++ {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()

				c, err := client.New(domain, fmt.Sprintf("dummy%d", i+1), "pass")
				if err != nil {
					log.Printf("Error creating client: %v", err)
					return
				}

				if err := c.Login(); err != nil {
					log.Printf("Error loging in client: %v", err)
					return
				}

				body := `{"data":"Y"}`
				req, err := http.NewRequest("POST", fmt.Sprintf("https://%s/system/vote/motion/%d", domain, votesPollID), strings.NewReader(body))
				if err != nil {
					log.Printf("Error creating request: %v", err)
					return
				}

				if _, err := client.CheckStatus(c.Do(req)); err != nil {
					log.Printf("Error sending vote request: %v", err)
					return
				}

				bar.Increment()
				return
			}(i)
		}

		progress.Wait()
		return nil
	},
}
