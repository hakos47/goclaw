package http

import (
	"crypto/rand"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
	"github.com/nextlevelbuilder/goclaw/internal/store"
)

type AuthWebAuthnHandler struct {
	devices      store.AuthorizedDeviceStore
	webauthnMap  map[string]*webauthn.WebAuthn
	sessionData  map[string]webauthn.SessionData
	gatewayToken string
	mu           sync.RWMutex
}

func NewAuthWebAuthnHandler(devices store.AuthorizedDeviceStore, gatewayToken string) *AuthWebAuthnHandler {
	origins := []string{"http://localhost:5174", "http://127.0.0.1:18790", "http://localhost:5173", "http://localhost:18790", "http://127.0.0.1:5174", "http://127.0.0.1:5173"}
	
	wLocalhost, err1 := webauthn.New(&webauthn.Config{
		RPDisplayName: "GoClaw Gateway",
		RPID:          "localhost",
		RPOrigins:     origins,
	})
	
	w127, err2 := webauthn.New(&webauthn.Config{
		RPDisplayName: "GoClaw Gateway",
		RPID:          "127.0.0.1",
		RPOrigins:     origins,
	})

	if err1 != nil || err2 != nil {
		panic("Failed to initialize WebAuthn instances")
	}

	return &AuthWebAuthnHandler{
		devices:      devices,
		gatewayToken: gatewayToken,
		webauthnMap: map[string]*webauthn.WebAuthn{
			"localhost": wLocalhost,
			"127.0.0.1": w127,
		},
		sessionData: make(map[string]webauthn.SessionData),
	}
}

func (h *AuthWebAuthnHandler) getWebAuthn(r *http.Request) *webauthn.WebAuthn {
	host := r.Header.Get("Origin")
	if host == "" {
		host = r.Host
	}
	if len(host) > 0 && (host == "http://127.0.0.1:5174" || host == "http://127.0.0.1:5173" || host == "http://127.0.0.1:18790" || host == "127.0.0.1:18790" || host == "127.0.0.1:5174") || host == "127.0.0.1" {
		return h.webauthnMap["127.0.0.1"]
	}
	
	// Consider 127.0.0.1 origins
	for _, o := range []string{"127.0.0.1:5174", "127.0.0.1:5173", "127.0.0.1:18790", "127.0.0.1", "http://127.0.0.1", "https://127.0.0.1"} {
		if len(host) >= len(o) && host[len(host)-len(o):] == o {
			return h.webauthnMap["127.0.0.1"]
		}
	}
	return h.webauthnMap["localhost"]
}

func (h *AuthWebAuthnHandler) RegisterRoutes(mux *http.ServeMux) {
	corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5174")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-WebAuthn-Session")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next(w, r)
		}
	}

	mux.HandleFunc("POST /v1/auth/webauthn/register/challenge", corsHandler(requireAuth("", h.handleRegisterChallenge)))
	mux.HandleFunc("POST /v1/auth/webauthn/register/verify", corsHandler(requireAuth("", h.handleRegisterVerify)))
	mux.HandleFunc("POST /v1/auth/webauthn/login/challenge", corsHandler(h.handleLoginChallenge))
	mux.HandleFunc("POST /v1/auth/webauthn/login/verify", corsHandler(h.handleLoginVerify))
	mux.HandleFunc("OPTIONS /v1/auth/webauthn/register/challenge", corsHandler(func(w http.ResponseWriter, r *http.Request) {}))
	mux.HandleFunc("OPTIONS /v1/auth/webauthn/register/verify", corsHandler(func(w http.ResponseWriter, r *http.Request) {}))
	mux.HandleFunc("OPTIONS /v1/auth/webauthn/login/challenge", corsHandler(func(w http.ResponseWriter, r *http.Request) {}))
	mux.HandleFunc("OPTIONS /v1/auth/webauthn/login/verify", corsHandler(func(w http.ResponseWriter, r *http.Request) {}))
}

func (h *AuthWebAuthnHandler) setSession(id string, data webauthn.SessionData) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.sessionData[id] = data
	go func() {
		time.Sleep(5 * time.Minute)
		h.mu.Lock()
		delete(h.sessionData, id)
		h.mu.Unlock()
	}()
}

func (h *AuthWebAuthnHandler) getSession(id string) (webauthn.SessionData, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	data, ok := h.sessionData[id]
	return data, ok
}

type webauthnUser struct {
	id          []byte
	name        string
	displayName string
	credentials []webauthn.Credential
}

func (u *webauthnUser) WebAuthnID() []byte { return u.id }
func (u *webauthnUser) WebAuthnName() string { return u.name }
func (u *webauthnUser) WebAuthnDisplayName() string { return u.displayName }
func (u *webauthnUser) WebAuthnIcon() string { return "" }
func (u *webauthnUser) WebAuthnCredentials() []webauthn.Credential { return u.credentials }

func (h *AuthWebAuthnHandler) handleRegisterChallenge(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := store.UserIDFromContext(ctx)
	tenantID := store.TenantIDFromContext(ctx)

	creds, err := h.devices.GetCredentials(ctx, tenantID, userID)
	if err != nil {
		slog.Error("GetCredentials failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to load user credentials"})
		return
	}

	user := &webauthnUser{
		id:          []byte(userID),
		name:        userID,
		displayName: userID,
		credentials: creds,
	}

	wauth := h.getWebAuthn(r)
	options, sessionData, err := wauth.BeginRegistration(user, webauthn.WithAuthenticatorSelection(protocol.AuthenticatorSelection{
		RequireResidentKey: protocol.ResidentKeyRequired(),
		ResidentKey:        protocol.ResidentKeyRequirementRequired,
		UserVerification:   protocol.VerificationRequired,
	}))
	if err != nil {
		slog.Error("BeginRegistration failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	sessionID := generateSessionID()
	h.setSession(sessionID, *sessionData)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"options":    options,
		"session_id": sessionID,
	})
}

func (h *AuthWebAuthnHandler) handleRegisterVerify(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := store.UserIDFromContext(ctx)
	tenantID := store.TenantIDFromContext(ctx)
	
	sessionID := r.Header.Get("X-WebAuthn-Session")
	slog.Info("webauthn: register verify", "received_session_id", sessionID, "stored_sessions", len(h.sessionData))

	sessionData, ok := h.getSession(sessionID)
	if !ok {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Session expired or invalid"})
		return
	}

	user := &webauthnUser{
		id:          []byte(userID),
		name:        userID,
		displayName: userID,
	}

	wauth := h.getWebAuthn(r)
	
	// Add custom parse to bypass JSON mapping issues if any, just like in Login
	parsedResponse, err := protocol.ParseCredentialCreationResponse(r)
	if err != nil {
		slog.Error("ParseCredentialCreationResponse failed", "error", err)
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body: " + err.Error()})
		return
	}

	credential, err := wauth.CreateCredential(user, sessionData, parsedResponse)
	if err != nil {
		slog.Error("CreateCredential failed", "error", err)
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	slog.Info("Saving new credential", "raw_id_hex", fmt.Sprintf("%x", credential.ID), "raw_id_length", len(credential.ID))

	// Save credential to DB
	// For Guardian mode, new devices are not trusted by default, but if user is already logged in securely, we can trust it.
	// We'll trust it automatically if registering from an authenticated session.
	err = h.devices.SaveCredential(ctx, tenantID, userID, "WebAuthn Device", true, credential)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to save credential"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *AuthWebAuthnHandler) handleLoginChallenge(w http.ResponseWriter, r *http.Request) {
	// Discoverable credential login (passwordless)
	wauth := h.getWebAuthn(r)
	options, sessionData, err := wauth.BeginDiscoverableLogin(webauthn.WithUserVerification(protocol.VerificationRequired))
	if err != nil {
		slog.Error("BeginDiscoverableLogin failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	sessionID := generateSessionID()
	h.setSession(sessionID, *sessionData)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"options":    options,
		"session_id": sessionID,
	})
}

func (h *AuthWebAuthnHandler) handleLoginVerify(w http.ResponseWriter, r *http.Request) {
	sessionID := r.Header.Get("X-WebAuthn-Session")
	slog.Info("handleLoginVerify called", "received_session", sessionID)
	
	sessionData, ok := h.getSession(sessionID)
	if !ok {
		slog.Error("handleLoginVerify: Session expired or invalid")
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Session expired or invalid"})
		return
	}

	var verifiedUserID string

	handler := func(rawID, userHandle []byte) (webauthn.User, error) {
		slog.Info("handleLoginVerify handler invoked", "raw_id_length", len(rawID), "raw_id_hex", fmt.Sprintf("%x", rawID))
		cred, tenantID, userID, err := h.devices.GetCredentialByID(r.Context(), rawID)
		if err != nil || cred == nil {
			slog.Error("GetCredentialByID Error inside handler", "error", err)
			return nil, fmt.Errorf("credential not found")
		}

		_ = tenantID

		verifiedUserID = userID

		user := &webauthnUser{
			id:          []byte(userID),
			name:        userID,
			displayName: userID,
			credentials: []webauthn.Credential{*cred},
		}
		return user, nil
	}

	wauth := h.getWebAuthn(r)
	_, err := wauth.FinishDiscoverableLogin(handler, sessionData, r)
	if err != nil {
		slog.Error("FinishDiscoverableLogin failed", "error", err)
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
		return
	}

	// Check token
	t := h.gatewayToken
	if t == "" {
		t = "goclaw_dev_token_12345"
	}

	slog.Info("handleLoginVerify successful", "returning_token_len", len(t), "token", t)
	writeJSON(w, http.StatusOK, map[string]string{
		"token":   t,
		"status":  "ok",
		"user_id": verifiedUserID,
	})
}
func generateSessionID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return uuid.New().String()
}
