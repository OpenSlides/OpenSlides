package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

func runCreateUsers(ctx context.Context, cfg *Config) error {
	c, err := newClient(cfg.domain, cfg.username, cfg.passwort, nil)
	if err != nil {
		return fmt.Errorf("creating client: %w", err)
	}

	if err := c.login(); err != nil {
		return fmt.Errorf("login client: %w", err)
	}

	var users []json.RawMessage
	for i := 1; i <= cfg.clientCount; i++ {
		user := fmt.Sprintf(`{"first_name":"dummy%d","default_password":"pass", "collectionString":"users/user","csvGroups":[],"groups_id":[],"importTrackId":1}`, i)
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

	req, err := http.NewRequestWithContext(ctx, "POST", "https://"+cfg.domain+"/rest/users/user/mass_import/", bytes.NewReader(bs))
	if err != nil {
		return fmt.Errorf("creating mass import request: %w", err)
	}

	url, err := url.Parse("https://" + cfg.domain)
	if err != nil {
		return fmt.Errorf("creating url: %w", err)
	}
	var csfr string
	for _, cookie := range c.hc.Jar.Cookies(url) {
		if cookie.Name == "OpenSlidesCsrfToken" {
			csfr = cookie.Value
			break
		}
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CSRFToken", csfr)

	if _, err := checkStatus(c.hc.Do(req)); err != nil {
		return fmt.Errorf("sending mass import request: %w", err)
	}

	return nil
}
