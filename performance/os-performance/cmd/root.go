package cmd

import (
	"fmt"
	"log"
	"os"

	"github.com/spf13/cobra"
)

var domain string

func init() {
	rootCmd.PersistentFlags().StringVarP(&domain, "domain", "d", "localhost:8000", "Domain where to send the requests")
}

var rootCmd = &cobra.Command{
	Use:   "os-performance",
	Short: "os-performance is a tool that brings OpenSlides to its limit.",
	Long:  `It brings diffrent tests to create many connections to an openslides instance.`,
	Run: func(cmd *cobra.Command, args []string) {
		log.Println("TODO: show usage")
	},
}

// Execute starts the root command.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
