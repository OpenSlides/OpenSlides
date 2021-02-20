package main

import (
	"flag"
	"fmt"
	"strings"
)

const (
	testBrowser = iota
	testConnect
	testCreateUsers
	testVotes
)

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

	test := f.String("t", "", "testcase [browser,connect,create_users]")

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
	case "create_users":
		cfg.testCase = testCreateUsers
	case "votes":
		cfg.testCase = testVotes
	default:
		return nil, fmt.Errorf("invalid testcase %s", *test)
	}

	return cfg, nil
}
