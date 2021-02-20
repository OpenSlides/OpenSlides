package main

// reading_client simulates clients, that login to openslides and after a
// successfull login send all request, that the client usual sends.
import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"time"

	"github.com/vbauerster/mpb/v6"
	"github.com/vbauerster/mpb/v6/decor"
)

const (
	pathLogin      = "/apps/users/login/"
	pathWhoami     = "/apps/users/whoami/"
	pathServertime = "/apps/core/servertime/"
	pathConstants  = "/apps/core/constants/"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt)
		<-c
		cancel()
	}()

	if err := run(ctx, os.Args); err != nil {
		if errors.Is(err, context.Canceled) {
			return
		}
		log.Printf("Error: %v", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, args []string) error {
	cfg, err := loadConfig(args[1:])
	if err != nil {
		return fmt.Errorf("loading config: %w", err)
	}

	switch cfg.testCase {
	case testBrowser:
		err = runBrowser(ctx, cfg)
	case testConnect:
		err = runKeepOpen(ctx, cfg)
	case testCreateUsers:
		err = runCreateUsers(ctx, cfg)
	case testVotes:
		err = runVotes(ctx, cfg)
	default:
		err = fmt.Errorf("unknown testCase")
	}

	if err != nil {
		return fmt.Errorf("running test: %w", err)
	}
	return nil
}

func runBrowser(_ context.Context, cfg *Config) error {
	log.Printf("using %d clients to %s", cfg.clientCount, cfg.domain)

	progress := mpb.New()
	bar := progress.AddBar(int64(cfg.clientCount) * 5)

	clients := make([]*client, cfg.clientCount)
	for i := range clients {
		c, err := newClient(cfg.domain, cfg.username, cfg.passwort, bar)
		if err != nil {
			return fmt.Errorf("creating client: %w", err)
		}
		clients[i] = c
	}

	start := time.Now()

	var wg sync.WaitGroup
	for _, c := range clients {
		wg.Add(1)
		go func(c *client) {
			defer wg.Done()
			if err := c.browser(); err != nil {
				log.Printf("Client failed: %v", err)
			}
		}(c)
	}

	wg.Wait()
	progress.Wait()
	log.Printf("Run for %v", time.Now().Sub(start))
	return nil
}

func runKeepOpen(ctx context.Context, cfg *Config) error {
	var path string
	var receivFunc func(string) (string, error)
	switch cfg.url {
	case "autoupdate":
		receivFunc = scannerAutoupdate
		path = "/system/" + cfg.url
	case "projector":
		path = "/system/projector?projector_ids=1"
		receivFunc = scannerProjector
	case "notify":
		path = "/system/" + cfg.url
		receivFunc = scannerNotify
	default:
		return fmt.Errorf("unknown autoupdate-url %s", cfg.url)
	}
	c, err := newClient(cfg.domain, cfg.username, cfg.passwort, nil)
	if err != nil {
		return fmt.Errorf("creating client: %w", err)
	}

	if err := c.login(); err != nil {
		return fmt.Errorf("login client: %w", err)
	}

	progress := mpb.New()
	received := make(chan string, 1)

	for i := 0; i < cfg.clientCount; i++ {
		go func() {
			r, err := c.keepOpen(ctx, path)
			if err != nil {
				log.Println("Can not create connection: %w", err)
				return
			}
			defer r.Close()

			// TODO: Listen to ctx.Done
			scanner := bufio.NewScanner(r)
			scanner.Buffer(make([]byte, 10), 1_000_000)
			for scanner.Scan() {
				msg, err := receivFunc(scanner.Text())
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
		case <-ctx.Done():
			return nil
		case msg := <-received:
			bar, ok := cidToBar[msg]
			if !ok {
				bar = progress.AddBar(int64(cfg.clientCount), mpb.PrependDecorators(decor.Name(msg)))
				cidToBar[msg] = bar
			}
			bar.Increment()
		}
	}
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

func scannerProjector(line string) (string, error) {
	var format struct {
		ToChangeID int `json:"change_id"`
	}
	if err := json.Unmarshal([]byte(line), &format); err != nil {
		return "", fmt.Errorf("decode json: %v", err)
	}
	return fmt.Sprintf("change id %d", format.ToChangeID), nil
}

func scannerNotify(line string) (string, error) {
	var format struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal([]byte(line), &format); err != nil {
		return "", fmt.Errorf("decode json: %v", err)
	}
	return fmt.Sprintf("notify name %s", format.Name), nil
}

func checkStatus(resp *http.Response, err error) (*http.Response, error) {
	if err != nil {
		return nil, fmt.Errorf("sending login request: %w", err)
	}

	if resp.StatusCode != 200 {
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			body = []byte("[can not read body]")
		}
		resp.Body.Close()
		return nil, fmt.Errorf("got status %s: %s", resp.Status, body)
	}
	return resp, nil
}
