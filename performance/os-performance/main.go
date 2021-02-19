package main

// reading_client simulates clients, that login to openslides and after a
// successfull login send all request, that the client usual sends.
import (
	"bufio"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/cookiejar"
	"os"
	"os/signal"
	"strings"
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

type incrementer interface {
	Increment()
}

type client struct {
	domain             string
	hc                 *http.Client
	username, password string
	inc                incrementer
}

// newClient creates a client object. No requests are sent.
func newClient(domain, username, password string, inc incrementer) (*client, error) {
	c := &client{
		domain:   "https://" + domain,
		username: username,
		password: password,
		inc:      inc,
	}

	jar, err := cookiejar.New(nil)
	if err != nil {
		return nil, fmt.Errorf("creating cookie jar: %w", err)
	}
	c.hc = &http.Client{
		Jar: jar,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}
	return c, nil
}

// browser sends the request each browser tab sends.
func (c *client) browser() error {
	if err := c.login(); err != nil {
		return fmt.Errorf("login client: %w", err)
	}

	if c.inc != nil {
		c.inc.Increment()
	}

	var wg sync.WaitGroup

	for _, path := range []string{
		pathWhoami,
		pathLogin,
		pathServertime,
		pathConstants,
	} {
		wg.Add(1)
		go func(path string) {
			defer wg.Done()

			if c.inc != nil {
				defer c.inc.Increment()
			}

			if err := c.get(context.Background(), path); err != nil {
				log.Printf("Error get request to %s: %v", path, err)
			}
		}(path)
	}

	wg.Wait()
	return nil
}

func (c *client) keepOpen(ctx context.Context, path string) (io.ReadCloser, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.domain+path, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	resp, err := checkStatus(c.hc.Do(req))
	if err != nil {
		return nil, fmt.Errorf("sending %s request: %w", path, err)
	}
	return resp.Body, nil
}

// login uses the username and password to login the client. Sets the returned
// cookie for later requests.
func (c *client) login() error {
	url := c.domain + pathLogin
	payload := fmt.Sprintf(`{"username": "%s", "password": "%s"}`, c.username, c.password)

	resp, err := checkStatus(c.hc.Post(url, "application/json", strings.NewReader(payload)))
	if err != nil {
		return fmt.Errorf("sending login request: %w", err)
	}
	resp.Body.Close()
	return nil
}

func (c *client) get(ctx context.Context, path string) error {
	req, err := http.NewRequestWithContext(ctx, "GET", c.domain+path, nil)
	if err != nil {
		return fmt.Errorf("creating request: %w", err)

	}

	resp, err := checkStatus(c.hc.Do(req))
	if err != nil {
		return fmt.Errorf("sending %s request: %w", path, err)
	}
	resp.Body.Close()
	return nil
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

// Config contains all settings that can be changed with command line options.
type Config struct {
	testCase    int
	clientCount int
	domain      string
	username    string
	passwort    string
	url         string
}

func loadConfig(args []string) (*Config, error) {
	cfg := new(Config)
	f := flag.NewFlagSet("args", flag.ExitOnError)

	f.IntVar(&cfg.clientCount, "n", 10, "number of connections to use")
	f.StringVar(&cfg.domain, "d", "localhost:8000", "host and port of the server to test")
	f.StringVar(&cfg.username, "u", "admin", "username to use for login")
	f.StringVar(&cfg.passwort, "p", "admin", "password to use for login")
	f.StringVar(&cfg.url, "url", "autoupdate", "only for the `connect` test. autoupdate, projector or notify")

	test := f.String("t", "", "testcase [browser,connect]")

	if err := f.Parse(args); err != nil {
		return nil, fmt.Errorf("parsing flags: %w", err)
	}

	if len(flag.Args()) > 0 {
		return nil, fmt.Errorf("invalid arguments: %s", strings.Join(flag.Args(), " "))
	}

	switch *test {
	case "browser":
		cfg.testCase = testBrowser
	case "connect":
		cfg.testCase = testConnect
	default:
		return nil, fmt.Errorf("invalid testcase %s", *test)
	}

	return cfg, nil
}

const (
	testBrowser = iota
	testConnect = iota
)
