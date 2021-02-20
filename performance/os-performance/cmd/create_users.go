package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/OpenSlides/OpenSlides/performance/os-performace/client"
	"github.com/spf13/cobra"
)

var (
	username string
	password string
	amount   int
)

func init() {
	rootCmd.AddCommand(createUserCmd)
	createUserCmd.Flags().StringVarP(&username, "username", "u", "admin", "Username that can create the users.")
	createUserCmd.Flags().StringVarP(&password, "password", "p", "admin", "Password to use.")
	createUserCmd.Flags().IntVarP(&amount, "amount", "a", 10, "Amount of users to create.")
}

var createUserCmd = &cobra.Command{
	Use:   "create_users",
	Short: "Create a log of users.",
	Long: `All users get a name like dummy1, have the password "pass",
			are present and in the group with id 3.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		c, err := client.New(domain, username, password, nil)
		if err != nil {
			return fmt.Errorf("creating client: %w", err)
		}

		if err := c.Login(); err != nil {
			return fmt.Errorf("login client: %w", err)
		}

		var users []json.RawMessage
		for i := 1; i <= amount; i++ {
			user := fmt.Sprintf(`{"first_name":"dummy%d","default_password":"pass","is_present":true,"collectionString":"users/user","csvGroups":[],"groups_id":[3],"importTrackId":1}`, i)
			users = append(users, []byte(user))
		}

		payload := struct {
			Users []json.RawMessage `json:"users"`
		}{
			users,
		}

		bs, err := json.Marshal(payload)
		if err != nil {
			return fmt.Errorf("encoding users: %w", err)
		}

		req, err := http.NewRequest("POST", "https://"+domain+"/rest/users/user/mass_import/", bytes.NewReader(bs))
		if err != nil {
			return fmt.Errorf("creating mass import request: %w", err)
		}

		req.Header.Set("Content-Type", "application/json")

		if _, err := client.CheckStatus(c.Do(req)); err != nil {
			return fmt.Errorf("sending mass import request: %w", err)
		}

		return nil
	},
}
