package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/cookiejar"
	"strings"
	"sync"
)

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

// Do works like http.Client.Do().
func (c *client) Do(req *http.Request) (*http.Response, error) {
	return c.hc.Do(req)
}
