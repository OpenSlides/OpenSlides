package client

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"strings"
)

const pathLogin = "/apps/users/login/"

// Client can send requests to the server.
type Client struct {
	domain             string
	hc                 *http.Client
	username, password string

	loginRetry int
}

// New creates a client object. No requests are sent.
func New(domain, username, password string, options ...Option) (*Client, error) {
	c := &Client{
		domain:     "https://" + domain,
		username:   username,
		password:   password,
		loginRetry: 1,
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

	for _, o := range options {
		o(c)
	}

	return c, nil
}

// Login uses the username and password to login the client. Sets the returned
// cookie for later requests.
func (c *Client) Login() error {
	url := c.domain + pathLogin
	payload := fmt.Sprintf(`{"username": "%s", "password": "%s"}`, c.username, c.password)

	var err error
	var resp *http.Response
	for i := 0; i < c.loginRetry; i++ {
		resp, err = CheckStatus(c.hc.Post(url, "application/json", strings.NewReader(payload)))
		if err == nil {
			break
		}
	}
	if err != nil {
		return fmt.Errorf("sending login request: %w", err)
	}
	resp.Body.Close()
	return nil
}

func (c *Client) get(ctx context.Context, path string) error {
	req, err := http.NewRequestWithContext(ctx, "GET", c.domain+path, nil)
	if err != nil {
		return fmt.Errorf("creating request: %w", err)

	}

	resp, err := CheckStatus(c.hc.Do(req))
	if err != nil {
		return fmt.Errorf("sending %s request: %w", path, err)
	}
	resp.Body.Close()
	return nil
}

// Do works like http.Client.Do().
//
// Sets the csfr header.
func (c *Client) Do(req *http.Request) (*http.Response, error) {
	var csfr string
	for _, cookie := range c.hc.Jar.Cookies(req.URL) {
		if cookie.Name == "OpenSlidesCsrfToken" {
			csfr = cookie.Value
			break
		}
	}
	req.Header.Set("X-CSRFToken", csfr)
	return c.hc.Do(req)
}

// CheckStatus is a helper that can be used around http.Do().
//
// It checks, that the returned status code is 200.
func CheckStatus(resp *http.Response, err error) (*http.Response, error) {
	if err != nil {
		return nil, fmt.Errorf("sending login request: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			body = []byte("[can not read body]")
		}
		resp.Body.Close()
		return nil, fmt.Errorf("got status %s: %s", resp.Status, body)
	}
	return resp, nil
}
