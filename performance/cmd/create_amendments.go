package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/OpenSlides/OpenSlides/performance/client"
	"github.com/spf13/cobra"
)

const helpCreateAmendments = `Creates a motions with amendments

...`

func cmdCreateAmendments(cfg *config) *cobra.Command {
	var amendmentAmount int

	cmd := &cobra.Command{
		Use:   "create_amendments",
		Short: "Creates a motion with amendments.",
		Long:  helpCreateAmendments,
		RunE: func(cmd *cobra.Command, args []string) error {
			c, err := client.New(cfg.domain, cfg.username, cfg.password)
			if err != nil {
				return fmt.Errorf("creating client: %w", err)
			}

			if err := c.Login(); err != nil {
				return fmt.Errorf("login client: %w", err)
			}

			addr := "https://" + cfg.domain

			motionID, err := createMotion(c, addr, amendmentAmount)
			if err != nil {
				return fmt.Errorf("create motion: %w", err)
			}

			for i := 0; i < amendmentAmount; i++ {
				createAmendment(c, addr, motionID, i)
			}

			fmt.Println(motionID)

			return nil
		},
	}

	cmd.Flags().IntVarP(&amendmentAmount, "amount", "a", 10, "Amount of amendments.")
	return cmd
}

func createMotion(c *client.Client, addr string, amendmentAmount int) (int, error) {
	var text string
	for i := 1; i <= amendmentAmount; i++ {
		text += fmt.Sprintf(`<p>Absatz %d</p>\n`, i)
	}

	payload := fmt.Sprintf(`{
		"title":"Testmotion",
		"text":"%s",
		"attachments_id":[],
		"agenda_type":2,
		"supporters_id":[],
		"workflow_id":1
	}`, text)

	req, err := http.NewRequest("POST", addr+"/rest/motions/motion/", strings.NewReader(payload))
	if err != nil {
		return 0, fmt.Errorf("sending motion create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.CheckStatus(c.Do(req))
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var respBody struct {
		Data struct {
			ID int `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&respBody); err != nil {
		return 0, fmt.Errorf("reading response: %w", err)
	}

	return respBody.Data.ID, nil
}

func createAmendment(c *client.Client, addr string, motionID, amendmentID int) error {
	prevParagraphs := strings.Repeat(`null,`, amendmentID)
	payload := fmt.Sprintf(`{
		"title":"Änderungsantrag zu %d",
		"text":"<p>Neu %d</p>",
		"parent_id":%d,
		"tags_id":[],
		"amendment_paragraphs":[%s"<p>Neu %d</p>"],
		"workflow_id":"1"
	}`, motionID, amendmentID+1, motionID, prevParagraphs, amendmentID+1)

	req, err := http.NewRequest("POST", addr+"/rest/motions/motion/", strings.NewReader(payload))
	if err != nil {
		return fmt.Errorf("creating amendment %d create request: %w", amendmentID, err)
	}

	req.Header.Set("Content-Type", "application/json")

	if _, err := client.CheckStatus(c.Do(req)); err != nil {
		return fmt.Errorf("sending amendment %d create request: %w", amendmentID, err)
	}

	return nil
}
