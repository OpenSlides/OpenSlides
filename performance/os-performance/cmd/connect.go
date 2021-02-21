package cmd

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"

	"github.com/OpenSlides/OpenSlides/performance/os-performace/client"
	"github.com/spf13/cobra"
	"github.com/vbauerster/mpb"
	"github.com/vbauerster/mpb/decor"
)

var connectionAmount int

func init() {
	rootCmd.AddCommand(connectCmd)
	connectCmd.Flags().IntVarP(&connectionAmount, "amount", "a", 10, "Amount of users to use.")
}

var connectCmd = &cobra.Command{
	Use:   "connect",
	Short: "Opens many connections to autoupdate and keeps them open.",
	Long: `Every connection is open and is waiting for autoupdate-messages
			For each change-id, you see a progress bar that shows how many
			connections got there answer.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		quit := make(chan struct{})
		go func() {
			c := make(chan os.Signal, 1)
			signal.Notify(c, os.Interrupt)
			<-c

			go func() {
				<-c
				os.Exit(2)
			}()

			close(quit)
		}()

		path := "/system/autoupdate"

		c, err := client.New(domain, username, password)
		if err != nil {
			return fmt.Errorf("creating client: %w", err)
		}

		if err := c.Login(); err != nil {
			return fmt.Errorf("login client: %w", err)
		}

		progress := mpb.New()
		received := make(chan string, 1)

		for i := 0; i < connectionAmount; i++ {
			go func() {
				r, err := keepOpen(c, path)
				if err != nil {
					log.Println("Can not create connection: %w", err)
					return
				}
				defer r.Close()

				scanner := bufio.NewScanner(r)
				scanner.Buffer(make([]byte, 10), 1_000_000)
				for scanner.Scan() {
					msg, err := scannerAutoupdate(scanner.Text())
					if err != nil {
						if errors.Is(err, context.Canceled) {
							return
						}
						log.Printf("Error parsing received data: %v", err)
						continue
					}
					received <- msg
				}
				if err := scanner.Err(); err != nil {
					if errors.Is(err, context.Canceled) {
						return
					}
					log.Println("Can not read body: %w", err)
					return
				}

			}()
		}

		cidToBar := make(map[string]*mpb.Bar)

		for {
			select {
			case <-quit:
				return nil
			case msg := <-received:
				bar, ok := cidToBar[msg]
				if !ok {
					bar = progress.AddBar(int64(connectionAmount), mpb.PrependDecorators(decor.Name(msg)))
					cidToBar[msg] = bar
				}
				bar.Increment()
			}
		}
	},
}

func keepOpen(c *client.Client, path string) (io.ReadCloser, error) {
	req, err := http.NewRequest("GET", "https://"+domain+path, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	resp, err := client.CheckStatus(c.Do(req))
	if err != nil {
		return nil, fmt.Errorf("sending %s request: %w", path, err)
	}
	return resp.Body, nil
}

func scannerAutoupdate(line string) (string, error) {
	if line == `{"connected":true}` {
		return "connect", nil
	}

	var format struct {
		ToChangeID int `json:"to_change_id"`
	}
	if err := json.Unmarshal([]byte(line), &format); err != nil {
		return "", fmt.Errorf("decode json: %v", err)
	}
	return fmt.Sprintf("change id %d", format.ToChangeID), nil
}
