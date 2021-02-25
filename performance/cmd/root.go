package cmd

import (
	"github.com/spf13/cobra"
)

const rootHelp = `Performance is an helper tool to test the limits of OpenSlies.

Each task is implemented as a subcommand.`

type config struct {
	domain   string
	username string
	password string
}

func cmdRoot(cfg *config) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "performance",
		Short: "performance is a tool that brings OpenSlides to its limit.",
		Long:  rootHelp,
	}

	cmd.PersistentFlags().StringVarP(&cfg.domain, "domain", "d", "localhost:8000", "Domain where to send the requests")
	cmd.PersistentFlags().StringVarP(&cfg.username, "username", "u", "admin", "Username that can create the users.")
	cmd.PersistentFlags().StringVarP(&cfg.password, "password", "p", "admin", "Password to use.")

	return cmd
}

// Execute starts the root command.
func Execute() error {
	cfg := new(config)
	cmd := cmdRoot(cfg)
	cmd.AddCommand(
		cmdBrowser(cfg),
		cmdConnect(cfg),
		cmdCreateUsers(cfg),
		cmdVotes(cfg),
	)

	return cmd.Execute()
}
