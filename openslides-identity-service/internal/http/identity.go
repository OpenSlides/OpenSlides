// Handles http requests
package http

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/OpenSlides/openslides-go/environment"
	"github.com/golang-jwt/jwt/v4"
)

var (
	envIssuerURL       = environment.NewVariable("OIDC_ISSUER_URL", "http://localhost:8080/realms/openslides", "URL of keycloak server")
	envIssuerURLDocker = environment.NewVariable("OIDC_ISSUER_URL_DOCKER", "http://keycloak-server:8080/realms/openslides", "Dockerized URL of keycloak server")
	envClientID        = environment.NewVariable("OIDC_CLIENT_ID", "proxy-client", "Keycloak client name")
	envClientSecret    = environment.NewVariable("OIDC_CLIENT_SECRET", "proxy-secret", "Keycloak client secret")
	envSecret          = environment.NewVariable("OIDC_SECRET", "qvAcTGWBIGg7aWKCKRyUsTf33jK3lsmK", "Keycloak secret")
)

// Identity validates OIDC JWT tokens and extracts the OS User ID
type Identity struct {
	issuerURLDocker string

	keys      map[string]*rsa.PublicKey
	expiresAt time.Time
}

// New initializes the Identity object.
//
// Returns the initialized Identity object
func NewIdentifier(lookup environment.Environmenter) *Identity {
	issuerURLDocker := envIssuerURLDocker.Value(lookup)
	if issuerURLDocker == "" {
		issuerURLDocker = envIssuerURL.Value(lookup)
	}

	a := &Identity{
		issuerURLDocker: issuerURLDocker,
		keys:            make(map[string]*rsa.PublicKey),
	}

	return a
}

// Identity uses the headers from the given request to get the user id.
func (id *Identity) Identify(w http.ResponseWriter, r *http.Request) (int, error) {
	p := new(payloadKeycloak)
	if err := id.loadTokenKeycloak(w, r, p); err != nil {
		fmt.Println("reading token: %w", err)
		return 0, fmt.Errorf("reading token: %w", err)
	}

	if p.KeycloakID == "" {
		return 0, nil
	}

	// Get OS User Id linked to Keycloak ID
	userID, err := strconv.Atoi(p.OSUserID)
	if err != nil {
		return 0, fmt.Errorf("user id is not an integer %v", p.OSUserID)
	}

	return userID, nil
}

// loadToken loads and validates the token. If the token is expired, it tries
// to renew it and write the new token in the responsewriter.
func (id *Identity) loadTokenKeycloak(w http.ResponseWriter, r *http.Request, payload jwt.Claims) error {
	header := r.Header.Get("Authorization")
	encodedToken := strings.TrimPrefix(header, "Bearer: ")

	if header == encodedToken {
		// No token. Handle the request as public access requst.
		return nil
	}

	_, err := id.validateToken(r.Context(), encodedToken)
	if err != nil {
		// OIDC validation failed - return error (no cookie means no legacy fallback)
		return fmt.Errorf("Invalid OIDC token %v", err)
	}

	_, err = jwt.ParseWithClaims(encodedToken, payload, func(token *jwt.Token) (interface{}, error) {
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("Missing kid in token header")
		}

		return id.getKey(r.Context(), kid)
	})

	if err != nil {
		var invalid *jwt.ValidationError
		if errors.As(err, &invalid) {
			fmt.Println(err)
			return fmt.Errorf("Authentication failed: %v", invalid)
		}
	}

	return nil
}

func (id *Identity) validateToken(ctx context.Context, tokenString string) (*payloadKeycloak, error) {
	// 1. Parse token without validation to get kid
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &payloadKeycloak{})
	if err != nil {
		return nil, fmt.Errorf("parsing token: %w", err)
	}

	kid, ok := token.Header["kid"].(string)
	if !ok {
		return nil, errors.New("missing kid in token header")
	}

	// 2. Get public key from JWKS (cached)
	key, err := id.getKey(ctx, kid)
	if err != nil {
		return nil, fmt.Errorf("getting key: %w", err)
	}

	// 3. Validate token with public key
	claims := &payloadKeycloak{}
	token, err = jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return key, nil
	})
	if err != nil {
		return nil, fmt.Errorf("validating token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// 4. Validate issuer
	//if claims.Issuer != a.issuerURLDocker {
	//	return nil, fmt.Errorf("invalid issuer: got %s, want %s", claims.Issuer, a.issuerURLDocker)
	//}

	return claims, nil
}

type payloadKeycloak struct {
	jwt.RegisteredClaims
	KeycloakID string `json:"sub"`
	SessionID  string `json:"sid"` // Keycloak session ID
	Email      string `json:"email"`
	Username   string `json:"preferred_username"`
	ClientName string `json:"azp"`
	OSUserID   string `json:"os_id"`
}

// getKey returns the RSA public key for the given kid, fetching from JWKS if needed
func (id *Identity) getKey(ctx context.Context, kid string) (*rsa.PublicKey, error) {
	if key, ok := id.keys[kid]; ok && time.Now().Before(id.expiresAt) {
		return key, nil
	}

	// Fetch JWKS
	return id.fetchJWKS(ctx, kid)
}

// fetchJWKS fetches the JWKS from the issuer and caches the keys
func (id *Identity) fetchJWKS(ctx context.Context, kid string) (*rsa.PublicKey, error) {
	// Double-check after acquiring write lock
	if key, ok := id.keys[kid]; ok && time.Now().Before(id.expiresAt) {
		return key, nil
	}

	req, err := http.NewRequestWithContext(ctx, "GET", id.issuerURLDocker+"/protocol/openid-connect/certs", nil)
	if err != nil {
		return nil, fmt.Errorf("creating JWKS request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("JWKS request failed: %s", resp.Status)
	}

	var jwks struct {
		Keys []struct {
			Kid string `json:"kid"`
			Kty string `json:"kty"`
			Alg string `json:"alg"`
			N   string `json:"n"`
			E   string `json:"e"`
		} `json:"keys"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("decoding JWKS: %w", err)
	}

	// Parse and cache all keys
	id.keys = make(map[string]*rsa.PublicKey)
	for _, k := range jwks.Keys {
		if k.Kty != "RSA" {
			continue
		}
		key, err := parseRSAPublicKey(k.N, k.E)
		if err != nil {
			continue
		}
		id.keys[k.Kid] = key
	}

	// Cache for 1 hour
	id.expiresAt = time.Now().Add(time.Hour)

	key, ok := id.keys[kid]
	if !ok {
		return nil, fmt.Errorf("key %s not found in JWKS", kid)
	}
	return key, nil
}

// parseRSAPublicKey parses RSA public key from JWKS n and e values
func parseRSAPublicKey(nStr, eStr string) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(nStr)
	if err != nil {
		return nil, fmt.Errorf("decoding n: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(eStr)
	if err != nil {
		return nil, fmt.Errorf("decoding e: %w", err)
	}

	n := new(big.Int).SetBytes(nBytes)
	e := int(new(big.Int).SetBytes(eBytes).Int64())

	return &rsa.PublicKey{N: n, E: e}, nil
}

// AuthenticatedContext returns a new context that contains a userID.
//
// Should only used for internal URLs. All other URLs should use auth.Authenticate.
func (id *Identity) AuthenticatedContext(ctx context.Context, userID int) context.Context {
	return context.WithValue(ctx, "user_id", userID)
}
