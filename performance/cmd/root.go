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
	http     bool
}

func (c *config) addr() string {
	proto := "https"
	if c.http {
		proto = "http"
	}
	return proto + "://" + c.domain
}

func cmdRoot(cfg *config) *cobra.Command {
	cmd := &cobra.Command{
		Use:          "performance",
		Short:        "performance is a tool that brings OpenSlides to its limit.",
		Long:         rootHelp,
		SilenceUsage: true,
	}

	cmd.PersistentFlags().StringVarP(&cfg.domain, "domain", "d", "localhost:8000", "Domain where to send the requests")
	cmd.PersistentFlags().StringVarP(&cfg.username, "username", "u", "admin", "Username that can create the users.")
	cmd.PersistentFlags().StringVarP(&cfg.password, "password", "p", "admin", "Password to use.")
	cmd.PersistentFlags().BoolVar(&cfg.http, "http", false, "Use http instead of https. Default is https.")

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
		cmdCreateAmendments(cfg),
		cmdCreateCandidates(cfg),
	)

	return cmd.Execute()
}
