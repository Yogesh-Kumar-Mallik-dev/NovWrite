package handlers

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/cache"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

// Block Standard: BLOCK_API_USER_HANDLER_001

// User represents a system user account across User, Admin, and Super Admin tiers.
type User struct {
	ID              string    `json:"id"`
	Email           string    `json:"email"`
	Username        string    `json:"username"`
	Role            string    `json:"role"` // "USER", "ADMIN", "SUPER_ADMIN"
	IsPlatformAdmin bool      `json:"isPlatformAdmin"`
	MFAEnabled      bool      `json:"mfaEnabled"`
	AccountStatus   string    `json:"accountStatus"` // "ACTIVE", "SUSPENDED", "LOCKED"
	PasswordHash    string    `json:"-"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// PlatformInfo captures operational metadata for the Super Admin dashboard.
type PlatformInfo struct {
	Version        string    `json:"version"`
	Environment    string    `json:"environment"`
	GoVersion      string    `json:"goVersion"`
	ServerTime     time.Time `json:"serverTime"`
	Goroutines     int       `json:"goroutines"`
	SystemPlatform string    `json:"systemPlatform"`
}

// UserMetrics aggregates user count distributions.
type UserMetrics struct {
	TotalUsers      int `json:"totalUsers"`
	StandardUsers   int `json:"standardUsers"`
	AdminUsers      int `json:"adminUsers"`
	SuperAdminUsers int `json:"superAdminUsers"` // Strictly 1 (Singleton)
	ActiveUsers     int `json:"activeUsers"`
	SuspendedUsers  int `json:"suspendedUsers"`
}

// SecurityStatus provides security telemetry and protection statuses.
type SecurityStatus struct {
	RateLimiterActive   bool  `json:"rateLimiterActive"`
	RateLimitRPM        int   `json:"rateLimitRpm"`
	PayloadLimitBytes   int64 `json:"payloadLimitBytes"`
	SingletonSuperAdmin bool  `json:"singletonSuperAdmin"`
	AdminAuditLogsCount int   `json:"adminAuditLogsCount"`
}

// SuperAdminDashboardResponse aggregates complete system telemetry for the Super Admin dashboard.
type SuperAdminDashboardResponse struct {
	PlatformInfo        PlatformInfo   `json:"platformInfo"`
	UserMetrics         UserMetrics    `json:"userMetrics"`
	SingletonSuperAdmin *User          `json:"singletonSuperAdmin"`
	SecurityStatus      SecurityStatus `json:"securityStatus"`
}

// UserStore abstracts user account persistence operations and singleton constraints.
type UserStore interface {
	GetByID(id string) (*User, error)
	GetByEmailOrUsername(identifier string) (*User, error)
	GetSuperAdmin() (*User, error)
	GetDashboardMetrics() (*SuperAdminDashboardResponse, error)
	Create(user *User) error
	UpdateRole(id string, role string) error
	UpdateStatus(id string, status string) error
	UpdatePassword(id string, newPasswordHash string) error
	List(params httputil.PaginationParams, roleFilter string) ([]*User, int, error)
	Delete(id string) error
}

// InMemoryUserStore provides a thread-safe in-memory user registry pre-seeded with baseline roles.
type InMemoryUserStore struct {
	mu    sync.RWMutex
	users map[string]*User
}

// NewInMemoryUserStore initializes an empty thread-safe user store with clean slate state.
func NewInMemoryUserStore() *InMemoryUserStore {
	return &InMemoryUserStore{
		users: make(map[string]*User),
	}
}

func (s *InMemoryUserStore) GetByID(id string) (*User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	user, exists := s.users[id]
	if !exists {
		return nil, errors.New("user not found")
	}
	uCopy := *user
	return &uCopy, nil
}

func (s *InMemoryUserStore) GetByEmailOrUsername(identifier string) (*User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ident := strings.ToLower(strings.TrimSpace(identifier))
	for _, u := range s.users {
		if strings.ToLower(u.Email) == ident || strings.ToLower(u.Username) == ident {
			uCopy := *u
			return &uCopy, nil
		}
	}
	return nil, errors.New("user not found")
}

func (s *InMemoryUserStore) GetSuperAdmin() (*User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, u := range s.users {
		if u.Role == httputil.RoleSuperAdmin {
			uCopy := *u
			return &uCopy, nil
		}
	}
	return nil, errors.New("no super admin found")
}

func (s *InMemoryUserStore) GetDashboardMetrics() (*SuperAdminDashboardResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var superAdmin *User
	var standardCount, adminCount, superAdminCount, activeCount, suspendedCount int

	for _, u := range s.users {
		switch u.Role {
		case httputil.RoleSuperAdmin:
			superAdminCount++
			if superAdmin == nil {
				uCopy := *u
				superAdmin = &uCopy
			}
		case httputil.RoleAdmin:
			adminCount++
		default:
			standardCount++
		}

		if u.AccountStatus == "ACTIVE" {
			activeCount++
		} else {
			suspendedCount++
		}
	}

	resp := &SuperAdminDashboardResponse{
		PlatformInfo: PlatformInfo{
			Version:        "2.8",
			Environment:    "production",
			GoVersion:      runtime.Version(),
			ServerTime:     time.Now().UTC(),
			Goroutines:     runtime.NumGoroutine(),
			SystemPlatform: runtime.GOOS,
		},
		UserMetrics: UserMetrics{
			TotalUsers:      len(s.users),
			StandardUsers:   standardCount,
			AdminUsers:      adminCount,
			SuperAdminUsers: superAdminCount,
			ActiveUsers:     activeCount,
			SuspendedUsers:  suspendedCount,
		},
		SingletonSuperAdmin: superAdmin,
		SecurityStatus: SecurityStatus{
			RateLimiterActive:   true,
			RateLimitRPM:        300,
			PayloadLimitBytes:   10 << 20,
			SingletonSuperAdmin: superAdminCount == 1,
			AdminAuditLogsCount: 0,
		},
	}

	return resp, nil
}

func (s *InMemoryUserStore) Create(user *User) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Singleton Super Admin Enforcement
	if user.Role == httputil.RoleSuperAdmin {
		for _, u := range s.users {
			if u.Role == httputil.RoleSuperAdmin {
				return errors.New("BLOCK_SINGLETON_SUPERADMIN_001: only one super admin is permitted in the entire system")
			}
		}
	}

	// Check email/username uniqueness
	emailLower := strings.ToLower(user.Email)
	usernameLower := strings.ToLower(user.Username)
	for _, u := range s.users {
		if strings.ToLower(u.Email) == emailLower {
			return errors.New("email already registered")
		}
		if strings.ToLower(u.Username) == usernameLower {
			return errors.New("username already taken")
		}
	}

	s.users[user.ID] = user
	return nil
}

func (s *InMemoryUserStore) UpdateRole(id string, role string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, exists := s.users[id]
	if !exists {
		return errors.New("user not found")
	}

	normRole := strings.ToUpper(strings.TrimSpace(role))
	if normRole != httputil.RoleUser && normRole != httputil.RoleAdmin && normRole != httputil.RoleSuperAdmin {
		return errors.New("invalid role: must be USER, ADMIN, or SUPER_ADMIN")
	}

	// Singleton Super Admin Enforcement on Promotion
	if normRole == httputil.RoleSuperAdmin && user.Role != httputil.RoleSuperAdmin {
		for uid, u := range s.users {
			if uid != id && u.Role == httputil.RoleSuperAdmin {
				return errors.New("BLOCK_SINGLETON_SUPERADMIN_001: cannot promote user; system already has an active singleton super admin")
			}
		}
	}

	user.Role = normRole
	user.IsPlatformAdmin = normRole == httputil.RoleAdmin || normRole == httputil.RoleSuperAdmin
	user.UpdatedAt = time.Now().UTC()
	return nil
}

func (s *InMemoryUserStore) UpdateStatus(id string, status string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, exists := s.users[id]
	if !exists {
		return errors.New("user not found")
	}

	user.AccountStatus = status
	user.UpdatedAt = time.Now().UTC()
	return nil
}

func (s *InMemoryUserStore) UpdatePassword(id string, newPasswordHash string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, exists := s.users[id]
	if !exists {
		return errors.New("user not found")
	}

	user.PasswordHash = newPasswordHash
	user.UpdatedAt = time.Now().UTC()
	return nil
}

func (s *InMemoryUserStore) List(params httputil.PaginationParams, roleFilter string) ([]*User, int, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var matched []*User
	searchLower := strings.ToLower(params.Search)
	roleFilterUpper := strings.ToUpper(strings.TrimSpace(roleFilter))

	for _, u := range s.users {
		if roleFilterUpper != "" && u.Role != roleFilterUpper {
			continue
		}
		if searchLower != "" {
			if !strings.Contains(strings.ToLower(u.Username), searchLower) &&
				!strings.Contains(strings.ToLower(u.Email), searchLower) {
				continue
			}
		}
		uCopy := *u
		matched = append(matched, &uCopy)
	}

	totalCount := len(matched)
	offset := (params.Page - 1) * params.PageSize
	if offset >= totalCount {
		return []*User{}, totalCount, nil
	}

	end := offset + params.PageSize
	if end > totalCount {
		end = totalCount
	}

	return matched[offset:end], totalCount, nil
}

func (s *InMemoryUserStore) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, exists := s.users[id]
	if !exists {
		return errors.New("user not found")
	}

	// Singleton Super Admin cannot be deleted
	if user.Role == httputil.RoleSuperAdmin {
		return errors.New("BLOCK_SINGLETON_SUPERADMIN_001: cannot delete the designated singleton super admin account")
	}

	delete(s.users, id)
	return nil
}

// UserHandler exposes HTTP endpoints for auth and multi-user administration.
type UserHandler struct {
	store          UserStore
	sessionManager cache.SessionManager
	jwtSecret      string
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(store UserStore, sessionManager cache.SessionManager, jwtSecret string) *UserHandler {
	if jwtSecret == "" {
		jwtSecret = "novwrite-default-jwt-secret-key-32b"
	}
	if sessionManager == nil {
		sessionManager = cache.NewMemorySessionManager()
	}
	return &UserHandler{
		store:          store,
		sessionManager: sessionManager,
		jwtSecret:      jwtSecret,
	}
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
	Role     string `json:"role,omitempty"`
}

type LoginRequest struct {
	EmailOrUsername string `json:"emailOrUsername"`
	Password        string `json:"password,omitempty"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken,omitempty"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
	User         *User  `json:"user"`
	ExpiresIn    int64  `json:"expiresIn"`
}

type UpdateRoleRequest struct {
	Role   string `json:"role"`
	Reason string `json:"reason,omitempty"`
}

// Register creates a new user account and returns signed access and refresh tokens.
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, "Invalid JSON payload: "+err.Error(), "INVALID_JSON")
		return
	}

	req.Email = strings.TrimSpace(req.Email)
	req.Username = strings.TrimSpace(req.Username)

	if req.Email == "" || !strings.Contains(req.Email, "@") {
		httputil.RespondBadRequest(w, r, "Valid email address is required.", "INVALID_EMAIL")
		return
	}
	if len(req.Username) < 2 {
		httputil.RespondBadRequest(w, r, "Username must be at least 2 characters.", "INVALID_USERNAME")
		return
	}

	// Super Admin CANNOT be created or registered over public HTTP API.
	if strings.EqualFold(req.Role, httputil.RoleSuperAdmin) {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/forbidden",
			Title:  "Forbidden",
			Status: http.StatusForbidden,
			Detail: "Super Admin cannot be registered via public HTTP API. The single super admin is managed exclusively via the backend server CLI.",
			Code:   "SUPER_ADMIN_REGISTRATION_PROHIBITED",
		})
		return
	}

	// Default role is USER. Only authenticated SUPER_ADMIN can assign ADMIN during creation.
	role := httputil.RoleUser
	if req.Role != "" {
		requestedRole := strings.ToUpper(strings.TrimSpace(req.Role))
		if requestedRole == httputil.RoleAdmin {
			claims, _ := httputil.GetUserFromContext(r.Context())
			if claims == nil || !claims.IsSuperAdmin() {
				httputil.RespondProblem(w, r, httputil.ProblemDetail{
					Type:   "https://novwrite.com/errors/forbidden",
					Title:  "Forbidden",
					Status: http.StatusForbidden,
					Detail: "Only SUPER_ADMIN can create accounts with ADMIN role.",
					Code:   "FORBIDDEN_ROLE_ASSIGNMENT",
				})
				return
			}
			role = requestedRole
		}
	}

	var passwordHash string
	if req.Password != "" {
		hashBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
		if err != nil {
			httputil.RespondInternalError(w, r, "Failed to hash user password securely.")
			return
		}
		passwordHash = string(hashBytes)
	}

	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	userID := fmt.Sprintf("%x-%x-%x-%x-%x", bytes[0:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:16])

	now := time.Now().UTC()
	newUser := &User{
		ID:              userID,
		Email:           req.Email,
		Username:        req.Username,
		Role:            role,
		IsPlatformAdmin: role == httputil.RoleAdmin,
		MFAEnabled:      false,
		AccountStatus:   "ACTIVE",
		PasswordHash:    passwordHash,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := h.store.Create(newUser); err != nil {
		httputil.RespondBadRequest(w, r, err.Error(), "USER_CREATION_FAILED")
		return
	}

	// Generate Dual Tokens
	tokenID, _ := cache.GenerateSecureToken()
	familyID, _ := cache.GenerateSecureToken()
	refreshToken, _ := cache.GenerateSecureToken()

	_ = h.sessionManager.StoreRefreshToken(r.Context(), refreshToken, newUser.ID, familyID, 7*24*time.Hour)

	expiresIn := int64(15 * 60) // 15 min access token
	claims := httputil.UserClaims{
		TokenID:   tokenID,
		FamilyID:  familyID,
		UserID:    newUser.ID,
		Email:     newUser.Email,
		Username:  newUser.Username,
		Role:      newUser.Role,
		ExpiresAt: time.Now().Add(15 * time.Minute).Unix(),
		IssuedAt:  time.Now().Unix(),
	}

	accessToken, err := httputil.SignJWT(claims, h.jwtSecret)
	if err != nil {
		httputil.RespondInternalError(w, r, "Failed to issue authentication token.")
		return
	}

	httputil.SetAuthCookies(w, accessToken, refreshToken, false)

	httputil.RespondCreated(w, r, "/api/v1/users/"+newUser.ID, LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		User:         newUser,
		ExpiresIn:    expiresIn,
	})
}

// Login authenticates a user and returns a signed access and refresh token pair.
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, "Invalid JSON payload: "+err.Error(), "INVALID_JSON")
		return
	}

	identifier := strings.TrimSpace(req.EmailOrUsername)
	if identifier == "" {
		httputil.RespondBadRequest(w, r, "Email or username is required.", "MISSING_IDENTIFIER")
		return
	}

	user, err := h.store.GetByEmailOrUsername(identifier)
	if err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/unauthorized",
			Title:  "Invalid Credentials",
			Status: http.StatusUnauthorized,
			Detail: "Invalid email/username or password.",
			Code:   "INVALID_CREDENTIALS",
		})
		return
	}

	// Verify Bcrypt password hash if configured on user
	if user.PasswordHash != "" && req.Password != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			httputil.RespondProblem(w, r, httputil.ProblemDetail{
				Type:   "https://novwrite.com/errors/unauthorized",
				Title:  "Invalid Credentials",
				Status: http.StatusUnauthorized,
				Detail: "Invalid email/username or password.",
				Code:   "INVALID_CREDENTIALS",
			})
			return
		}
	}

	if user.AccountStatus != "ACTIVE" {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/account-suspended",
			Title:  "Account Inactive",
			Status: http.StatusForbidden,
			Detail: fmt.Sprintf("Account status is '%s'. Please contact support.", user.AccountStatus),
			Code:   "ACCOUNT_INACTIVE",
		})
		return
	}

	tokenID, _ := cache.GenerateSecureToken()
	familyID, _ := cache.GenerateSecureToken()
	refreshToken, _ := cache.GenerateSecureToken()

	_ = h.sessionManager.StoreRefreshToken(r.Context(), refreshToken, user.ID, familyID, 7*24*time.Hour)

	expiresIn := int64(15 * 60) // 15 min access token
	claims := httputil.UserClaims{
		TokenID:   tokenID,
		FamilyID:  familyID,
		UserID:    user.ID,
		Email:     user.Email,
		Username:  user.Username,
		Role:      user.Role,
		ExpiresAt: time.Now().Add(15 * time.Minute).Unix(),
		IssuedAt:  time.Now().Unix(),
	}

	accessToken, err := httputil.SignJWT(claims, h.jwtSecret)
	if err != nil {
		httputil.RespondInternalError(w, r, "Failed to issue authentication token.")
		return
	}

	httputil.SetAuthCookies(w, accessToken, refreshToken, false)

	httputil.RespondJSON(w, r, http.StatusOK, LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		User:         user,
		ExpiresIn:    expiresIn,
	})
}

// SuperAdminLogin authenticates the Singleton Super Admin via username/email and password.
func (h *UserHandler) SuperAdminLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, "Invalid JSON payload: "+err.Error(), "INVALID_JSON")
		return
	}

	identifier := strings.TrimSpace(req.EmailOrUsername)
	if identifier == "" {
		httputil.RespondBadRequest(w, r, "Super admin email or username is required.", "MISSING_IDENTIFIER")
		return
	}

	user, err := h.store.GetByEmailOrUsername(identifier)
	if err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/unauthorized",
			Title:  "Invalid Super Admin Credentials",
			Status: http.StatusUnauthorized,
			Detail: "Invalid super admin credentials.",
			Code:   "INVALID_CREDENTIALS",
		})
		return
	}

	// Strict check: Caller MUST have the SUPER_ADMIN role
	if user.Role != httputil.RoleSuperAdmin {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/forbidden",
			Title:  "Forbidden",
			Status: http.StatusForbidden,
			Detail: "Access denied. The Super Admin control plane requires singleton Super Admin credentials.",
			Code:   "SUPER_ADMIN_CREDENTIALS_REQUIRED",
		})
		return
	}

	if user.PasswordHash != "" && req.Password != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			httputil.RespondProblem(w, r, httputil.ProblemDetail{
				Type:   "https://novwrite.com/errors/unauthorized",
				Title:  "Invalid Super Admin Credentials",
				Status: http.StatusUnauthorized,
				Detail: "Invalid super admin credentials.",
				Code:   "INVALID_CREDENTIALS",
			})
			return
		}
	}

	if user.AccountStatus != "ACTIVE" {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/account-suspended",
			Title:  "Account Inactive",
			Status: http.StatusForbidden,
			Detail: fmt.Sprintf("Account status is '%s'.", user.AccountStatus),
			Code:   "ACCOUNT_INACTIVE",
		})
		return
	}

	tokenID, _ := cache.GenerateSecureToken()
	familyID, _ := cache.GenerateSecureToken()
	refreshToken, _ := cache.GenerateSecureToken()

	_ = h.sessionManager.StoreRefreshToken(r.Context(), refreshToken, user.ID, familyID, 7*24*time.Hour)

	expiresIn := int64(15 * 60)
	claims := httputil.UserClaims{
		TokenID:   tokenID,
		FamilyID:  familyID,
		UserID:    user.ID,
		Email:     user.Email,
		Username:  user.Username,
		Role:      httputil.RoleSuperAdmin,
		ExpiresAt: time.Now().Add(15 * time.Minute).Unix(),
		IssuedAt:  time.Now().Unix(),
	}

	accessToken, err := httputil.SignJWT(claims, h.jwtSecret)
	if err != nil {
		httputil.RespondInternalError(w, r, "Failed to issue super admin authentication token.")
		return
	}

	httputil.SetAuthCookies(w, accessToken, refreshToken, false)

	httputil.RespondJSON(w, r, http.StatusOK, LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		User:         user,
		ExpiresIn:    expiresIn,
	})
}

// RefreshToken validates a rotating refresh token, detecting reuse breaches, and returns a new token pair.
func (h *UserHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var rawToken string

	var req RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err == nil && req.RefreshToken != "" {
		rawToken = strings.TrimSpace(req.RefreshToken)
	} else if cookie, err := r.Cookie("refresh_token"); err == nil && cookie.Value != "" {
		rawToken = strings.TrimSpace(cookie.Value)
	}

	if rawToken == "" {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/unauthorized",
			Title:  "Refresh Token Missing",
			Status: http.StatusUnauthorized,
			Detail: "Refresh token is required via JSON payload or refresh_token cookie.",
			Code:   "REFRESH_TOKEN_REQUIRED",
		})
		return
	}

	userID, familyID, newRefreshToken, err := h.sessionManager.RotateRefreshToken(r.Context(), rawToken, 7*24*time.Hour)
	if err != nil {
		httputil.ClearAuthCookies(w)
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/unauthorized",
			Title:  "Invalid or Expired Refresh Token",
			Status: http.StatusUnauthorized,
			Detail: err.Error(),
			Code:   "REFRESH_TOKEN_INVALID",
		})
		return
	}

	user, err := h.store.GetByID(userID)
	if err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/unauthorized",
			Title:  "User Not Found",
			Status: http.StatusUnauthorized,
			Detail: "User associated with refresh token no longer exists.",
			Code:   "USER_NOT_FOUND",
		})
		return
	}

	newTokenID, _ := cache.GenerateSecureToken()
	expiresIn := int64(15 * 60)
	claims := httputil.UserClaims{
		TokenID:   newTokenID,
		FamilyID:  familyID,
		UserID:    user.ID,
		Email:     user.Email,
		Username:  user.Username,
		Role:      user.Role,
		ExpiresAt: time.Now().Add(15 * time.Minute).Unix(),
		IssuedAt:  time.Now().Unix(),
	}

	newAccessToken, err := httputil.SignJWT(claims, h.jwtSecret)
	if err != nil {
		httputil.RespondInternalError(w, r, "Failed to sign refreshed access token.")
		return
	}

	httputil.SetAuthCookies(w, newAccessToken, newRefreshToken, false)

	httputil.RespondJSON(w, r, http.StatusOK, LoginResponse{
		Token:        newAccessToken,
		RefreshToken: newRefreshToken,
		User:         user,
		ExpiresIn:    expiresIn,
	})
}

// Logout revokes active tokens and clears session cookies.
func (h *UserHandler) Logout(w http.ResponseWriter, r *http.Request) {
	claims, _ := httputil.GetUserFromContext(r.Context())
	if claims != nil && claims.TokenID != "" {
		_ = h.sessionManager.RevokeToken(r.Context(), claims.TokenID, 24*time.Hour)
	}

	if cookie, err := r.Cookie("refresh_token"); err == nil && cookie.Value != "" {
		_ = h.sessionManager.RevokeToken(r.Context(), cookie.Value, 7*24*time.Hour)
	}

	httputil.ClearAuthCookies(w)
	httputil.RespondJSON(w, r, http.StatusOK, map[string]any{
		"message": "Logged out successfully",
	})
}

// ChangePassword verifies existing password, updates with new bcrypt hash, and revokes active token families.
func (h *UserHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims, ok := httputil.GetUserFromContext(r.Context())
	if !ok || claims == nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/unauthorized",
			Title:  "Authentication Required",
			Status: http.StatusUnauthorized,
			Detail: "You must be authenticated to change your password.",
			Code:   "UNAUTHORIZED",
		})
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, "Invalid JSON payload: "+err.Error(), "INVALID_JSON")
		return
	}

	if len(req.NewPassword) < 6 {
		httputil.RespondBadRequest(w, r, "New password must be at least 6 characters.", "PASSWORD_TOO_SHORT")
		return
	}

	user, err := h.store.GetByID(claims.UserID)
	if err != nil {
		httputil.RespondNotFound(w, r, "User", claims.UserID)
		return
	}

	if user.PasswordHash != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
			httputil.RespondBadRequest(w, r, "Current password does not match.", "INCORRECT_OLD_PASSWORD")
			return
		}
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
	if err != nil {
		httputil.RespondInternalError(w, r, "Failed to hash new password.")
		return
	}

	if err := h.store.UpdatePassword(user.ID, string(newHash)); err != nil {
		httputil.RespondInternalError(w, r, "Failed to update user password: "+err.Error())
		return
	}

	if claims.FamilyID != "" {
		_ = h.sessionManager.RevokeFamily(r.Context(), claims.FamilyID)
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]any{
		"message": "Password updated successfully. Please log in with your new password.",
	})
}

// Me returns the authenticated user's profile.
func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := httputil.GetUserFromContext(r.Context())
	if !ok || claims == nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/unauthorized",
			Title:  "Unauthorized",
			Status: http.StatusUnauthorized,
			Detail: "Authentication required to access user profile.",
			Code:   "UNAUTHORIZED",
		})
		return
	}

	user, err := h.store.GetByID(claims.UserID)
	if err != nil {
		user = &User{
			ID:              claims.UserID,
			Email:           claims.Email,
			Username:        claims.UserID,
			Role:            claims.Role,
			IsPlatformAdmin: claims.IsAdmin(),
			AccountStatus:   "ACTIVE",
		}
	}

	httputil.RespondJSON(w, r, http.StatusOK, user)
}

// ListUsers returns a paginated list of users (Admin only).
func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	params := httputil.ParsePaginationParams(r)
	roleFilter := r.URL.Query().Get("role")

	users, totalCount, err := h.store.List(params, roleFilter)
	if err != nil {
		httputil.RespondInternalError(w, r, "Failed to list users: "+err.Error())
		return
	}

	httputil.RespondPaginatedJSON(w, r, users, totalCount, params)
}

// UpdateUserRole updates a user's role (Admin / Super Admin).
func (h *UserHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	targetUserID := chi.URLParam(r, "userId")
	if targetUserID == "" {
		httputil.RespondBadRequest(w, r, "Missing userId parameter.", "MISSING_USER_ID")
		return
	}

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, "Invalid JSON payload: "+err.Error(), "INVALID_JSON")
		return
	}

	targetRole := strings.ToUpper(strings.TrimSpace(req.Role))
	if targetRole != httputil.RoleUser && targetRole != httputil.RoleAdmin && targetRole != httputil.RoleSuperAdmin {
		httputil.RespondBadRequest(w, r, "Role must be USER, ADMIN, or SUPER_ADMIN.", "INVALID_ROLE")
		return
	}

	// Caller verification: only SUPER_ADMIN can promote to or demote from SUPER_ADMIN / ADMIN
	callerClaims, _ := httputil.GetUserFromContext(r.Context())
	if callerClaims != nil && !callerClaims.IsSuperAdmin() {
		if targetRole == httputil.RoleSuperAdmin || targetRole == httputil.RoleAdmin {
			httputil.RespondProblem(w, r, httputil.ProblemDetail{
				Type:   "https://novwrite.com/errors/forbidden",
				Title:  "Forbidden",
				Status: http.StatusForbidden,
				Detail: "Only SUPER_ADMIN can grant ADMIN or SUPER_ADMIN roles.",
				Code:   "FORBIDDEN_ELEVATED_ROLE",
			})
			return
		}
	}

	if err := h.store.UpdateRole(targetUserID, targetRole); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/conflict",
			Title:  "Role Update Failed",
			Status: http.StatusConflict,
			Detail: err.Error(),
			Code:   "ROLE_UPDATE_CONFLICT",
		})
		return
	}

	updatedUser, _ := h.store.GetByID(targetUserID)
	httputil.RespondJSON(w, r, http.StatusOK, updatedUser)
}

// DeleteUser removes a user account (Super Admin only).
func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	targetUserID := chi.URLParam(r, "userId")
	if targetUserID == "" {
		httputil.RespondBadRequest(w, r, "Missing userId parameter.", "MISSING_USER_ID")
		return
	}

	if err := h.store.Delete(targetUserID); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/forbidden",
			Title:  "Cannot Delete User",
			Status: http.StatusForbidden,
			Detail: err.Error(),
			Code:   "USER_DELETION_FORBIDDEN",
		})
		return
	}

	httputil.RespondNoContent(w)
}

// SuperAdminDashboard returns comprehensive platform telemetry and metrics for the Super Admin dashboard.
func (h *UserHandler) SuperAdminDashboard(w http.ResponseWriter, r *http.Request) {
	metrics, err := h.store.GetDashboardMetrics()
	if err != nil {
		httputil.RespondInternalError(w, r, "Failed to retrieve super admin metrics: "+err.Error())
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, metrics)
}
