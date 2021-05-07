package cmd

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
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

Example:

performance votes motion --amount 100 --poll_id 42

performance votes assignment --amount 100 --poll_id 42

`

func cmdVotes(cfg *config) *cobra.Command {
	cmd := &cobra.Command{
		Use:       "votes",
		Short:     "Sends many votes from different users",
		ValidArgs: []string{"motion", "assignment", "m", "a"},
		Args:      cobra.ExactValidArgs(1),
		Long:      voteHelp,
	}

	amount := cmd.Flags().IntP("amount", "n", 10, "Amount of users to use.")
	pollID := cmd.Flags().IntP("poll_id", "i", 1, "ID of the poll to use.")
	interrupt := cmd.Flags().Bool("interrupt", false, "Wait for a user input after login.")
	loginRetry := cmd.Flags().IntP("login_retry", "r", 3, "Retries send login requests before returning an error.")
	choice := cmd.Flags().IntP("choice", "c", 0, "Amount of answers per vote.")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		var assignment bool
		if args[0] == "assignment" || args[0] == "a" {
			assignment = true
		}

		url := "%s/rest/motions/motion-poll/%d/vote/"
		vote := `{"data":"Y"}`
		if assignment {
			url = "%s/rest/assignments/assignment-poll/%d/vote/"
			options, err := assignmentPollOptions(cfg.addr(), *pollID)
			if err != nil {
				return fmt.Errorf("fetch options: %w", err)
			}

			votedata := make(map[string]int)
			for i, o := range options {
				if *choice != 0 && i >= *choice {
					break
				}
				votedata[strconv.Itoa(o)] = 1
			}

			decoded, err := json.Marshal(votedata)
			if err != nil {
				return fmt.Errorf("decoding assignment option data: %w", err)
			}

			vote = fmt.Sprintf(`{"data":%s}`, decoded)
		}
		url = fmt.Sprintf(url, cfg.addr(), *pollID)

		var clients []*client.Client
		for i := 0; i < *amount; i++ {
			c, err := client.New(cfg.addr(), fmt.Sprintf("dummy%d", i+1), "pass", client.WithLoginRetry(*loginRetry))
			if err != nil {
				return fmt.Errorf("creating client: %w", err)
			}
			clients = append(clients, c)
		}

		log.Printf("Login %d clients", *amount)
		start := time.Now()
		massLogin(clients, *loginRetry)
		log.Printf("All clients logged in %v", time.Now().Sub(start))

		if *interrupt {
			reader := bufio.NewReader(os.Stdin)
			fmt.Println("Hit enter to continue")
			reader.ReadString('\n')
			log.Println("Starting voting")
		}

		start = time.Now()
		massVotes(clients, url, vote)
		log.Printf("All Clients have voted in %v", time.Now().Sub(start))
		return nil

	}

	return cmd
}

func assignmentPollOptions(addr string, pollID int) ([]int, error) {
	c, err := client.New(addr, "dummy1", "pass")
	if err != nil {
		return nil, fmt.Errorf("creating admin client: %w", err)
	}

	if err := c.Login(); err != nil {
		return nil, fmt.Errorf("login admin client: %w", err)
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/system/autoupdate", addr), nil)
	if err != nil {
		return nil, fmt.Errorf("creating fetching all request: %w", err)
	}

	resp, err := c.Do(req)
	if err != nil {
		return nil, fmt.Errorf("sending fetch all request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			body = []byte(fmt.Sprintf("[can not read body: %v", err))
		}
		return nil, fmt.Errorf("got status %s: %s", resp.Status, body)
	}

	// First message is a connection info. Throw it away.
	var devNull json.RawMessage
	if err := json.NewDecoder(resp.Body).Decode(&devNull); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	var content struct {
		Changed map[string][]json.RawMessage `json:"changed"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&content); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	polls := content.Changed["assignments/assignment-poll"]
	if len(polls) == 0 {
		return nil, fmt.Errorf("no polls found")
	}

	for i, p := range polls {
		var poll struct {
			ID        int   `json:"id"`
			OptionIDs []int `json:"options_id"`
		}
		if err := json.Unmarshal(p, &poll); err != nil {
			return nil, fmt.Errorf("decoding %dth poll: %w", i, err)
		}
		if poll.ID != pollID {
			continue
		}
		return poll.OptionIDs, nil
	}
	return nil, fmt.Errorf("no assignment-poll with id %d", pollID)
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

func massVotes(clients []*client.Client, url string, vote string) {
	var wgVote sync.WaitGroup
	progress := mpb.New(mpb.WithWaitGroup(&wgVote))
	voteBar := progress.AddBar(int64(len(clients)))
	for i := 0; i < len(clients); i++ {
		wgVote.Add(1)
		go func(c *client.Client) {
			defer wgVote.Done()

			req, err := http.NewRequest("POST", url, strings.NewReader(vote))
			if err != nil {
				log.Printf("Error creating request: %v", err)
				return
			}

			req.Header.Set("Content-Type", "application/json")

			if _, err := client.CheckStatus(c.Do(req)); err != nil {
				log.Printf("Error sending vote request to %s: %v", url, err)
				return
			}

			voteBar.Increment()
			return
		}(clients[i])
	}
	progress.Wait()
}
