package client

// Option is an optional argument for New().
type Option func(*Client)

// WithLoginRetry sets a number that login should retry befor failing.
func WithLoginRetry(n int) Option {
	return func(c *Client) {
		c.loginRetry = n
	}
}
