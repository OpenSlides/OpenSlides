package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/OpenSlides/OpenSlides/performance/client"
	"github.com/spf13/cobra"
)

const helpCreateCandidates = `Creates candidates to an assignment

This command can be used to test assignment votes.
`

func cmdCreateCandidates(cfg *config) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "create_candidates",
		Short: "Creates candidates to an assignment",
		Long:  helpCreateCandidates,
	}

	amount := cmd.Flags().IntP("amount", "a", 10, "amount of candidates to add")
	assignmentID := cmd.Flags().Int("assignment_id", 0, "assignment where the candidates are created")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		c, err := client.New(cfg.addr(), cfg.username, cfg.password)
		if err != nil {
			return fmt.Errorf("creating client: %w", err)
		}

		if err := c.Login(); err != nil {
			return fmt.Errorf("login client: %w", err)
		}

		uids, err := userIDs(cfg, c, *amount)
		if err != nil {
			return fmt.Errorf("getting userIDs: %w", err)
		}

		for _, id := range uids {
			if err := createCandidate(c, cfg.addr(), *assignmentID, id); err != nil {
				return fmt.Errorf("create candidate for uid %d: %w", id, err)
			}
		}
		return nil
	}
	return cmd
}

func createCandidate(c *client.Client, addr string, assignmentID int, userID int) error {
	req, err := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/rest/assignments/assignment/%d/candidature_other/", addr, assignmentID),
		strings.NewReader(fmt.Sprintf(`{"user":%d}`, userID)),
	)
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	if _, err := client.CheckStatus(c.Do(req)); err != nil {
		return fmt.Errorf("sending request: %w", err)
	}

	return nil
}

func userIDs(cfg *config, c *client.Client, amount int) ([]int, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/system/autoupdate", cfg.addr()), nil)
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

	users := content.Changed["users/user"]
	if len(users) == 0 {
		return nil, fmt.Errorf("no users found")
	}

	var ids []int
	for i, u := range users {
		var user struct {
			ID       int    `json:"id"`
			UserName string `json:"username"`
		}
		if err := json.Unmarshal(u, &user); err != nil {
			return nil, fmt.Errorf("decoding %dth user: %w", i, err)
		}

		if !strings.HasPrefix(user.UserName, "dummy") {
			continue
		}
		ids = append(ids, user.ID)
		if len(ids) >= amount {
			return ids, nil
		}
	}
	return nil, fmt.Errorf("could not find %d dummy users", amount)
}
