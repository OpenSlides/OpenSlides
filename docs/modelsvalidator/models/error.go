package models

import (
	"fmt"
	"strings"
)

// ErrorList is an error that contains a list of other errors.
type ErrorList struct {
	Name   string
	intent int
	Errs   []error
}

func (e *ErrorList) append(err error) {
	if err == nil {
		return
	}

	e.Errs = append(e.Errs, err)
}

func (e ErrorList) Error() string {
	intent := strings.Repeat(" ", e.intent)
	var msgs []string
	for _, err := range e.Errs {
		msgs = append(msgs, fmt.Sprintf("%s* %v", intent, err))
	}
	msg := strings.Join(msgs, "\n")
	if e.Name != "" {
		return fmt.Sprintf("%s:\n%s", e.Name, msg)
	}
	return msg
}

func (e *ErrorList) empty() bool {
	return len(e.Errs) == 0
}
