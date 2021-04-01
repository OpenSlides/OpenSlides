package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/OpenSlides/OpenSlides/performance/client"
	"github.com/spf13/cobra"
)

const createUsersHelp = `Creates many users

This command does not run any test. It is a helper for other tests that
require, that there a many users created at the server.

Do not run this command against a productive instance. It will change
the database.

Each user is called dummy1, dummy2 etc and has the password "pass".

Each user is in the group with the id 3 which should be the group
"delegates".`

func cmdCreateUsers(cfg *config) *cobra.Command {
	var createUserAmount int

	cmd := &cobra.Command{
		Use:   "create_users",
		Short: "Create a lot of users.",
		Long:  createUsersHelp,
		RunE: func(cmd *cobra.Command, args []string) error {
			c, err := client.New(cfg.domain, cfg.username, cfg.password)
			if err != nil {
				return fmt.Errorf("creating client: %w", err)
			}

			if err := c.Login(); err != nil {
				return fmt.Errorf("login client: %w", err)
			}

			var users []json.RawMessage
			for i := 1; i <= createUserAmount; i++ {
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

			req, err := http.NewRequest("POST", "https://"+cfg.domain+"/rest/users/user/mass_import/", bytes.NewReader(bs))
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

	cmd.Flags().IntVarP(&createUserAmount, "amount", "a", 10, "Amount of users to create.")
	return cmd
}
