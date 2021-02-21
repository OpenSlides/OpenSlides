package cmd

import (
	"github.com/spf13/cobra"
)

var (
	domain   string
	username string
	password string
)

func init() {
	rootCmd.PersistentFlags().StringVarP(&domain, "domain", "d", "localhost:8000", "Domain where to send the requests")
	rootCmd.PersistentFlags().StringVarP(&username, "username", "u", "admin", "Username that can create the users.")
	rootCmd.PersistentFlags().StringVarP(&password, "password", "p", "admin", "Password to use.")
}

var rootCmd = &cobra.Command{
	Use:   "os-performance",
	Short: "os-performance is a tool that brings OpenSlides to its limit.",
	Long:  `It brings diffrent tests to create many connections to an openslides instance.`,
	Run: func(cmd *cobra.Command, args []string) {
		cmd.Usage()
	},
}

// Execute starts the root command.
func Execute() error {
	return rootCmd.Execute()
}
