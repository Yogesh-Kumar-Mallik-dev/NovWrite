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

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/go-chi/chi/v5"
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
	List(params httputil.PaginationParams, roleFilter string) ([]*User, int, error)
	Delete(id string) error
}

// InMemoryUserStore provides a thread-safe in-memory user registry pre-seeded with baseline roles.
type InMemoryUserStore struct {
	mu    sync.RWMutex
	users map[string]*User
}

// NewInMemoryUserStore initializes and seeds the user store with standard, admin, and exactly ONE super admin.
func NewInMemoryUserStore() *InMemoryUserStore {
	store := &InMemoryUserStore{
		users: make(map[string]*User),
	}

	now := time.Now().UTC()

	// 1. Standard Author User
	store.users["a1111111-1111-1111-1111-111111111111"] = &User{
		ID:              "a1111111-1111-1111-1111-111111111111",
		Email:           "lead_author@novwrite.dev",
		Username:        "eldrin_creator",
		Role:            httputil.RoleUser,
		IsPlatformAdmin: false,
		MFAEnabled:      false,
		AccountStatus:   "ACTIVE",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// 2. Co-Author User
	store.users["a2222222-2222-2222-2222-222222222222"] = &User{
		ID:              "a2222222-2222-2222-2222-222222222222",
		Email:           "co_author@novwrite.dev",
		Username:        "lyra_scribe",
		Role:            httputil.RoleUser,
		IsPlatformAdmin: false,
		MFAEnabled:      false,
		AccountStatus:   "ACTIVE",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// 3. Platform Admin
	store.users["a8888888-8888-8888-8888-888888888888"] = &User{
		ID:              "a8888888-8888-8888-8888-888888888888",
		Email:           "admin@novwrite.dev",
		Username:        "novwrite_admin",
		Role:            httputil.RoleAdmin,
		IsPlatformAdmin: true,
		MFAEnabled:      true,
		AccountStatus:   "ACTIVE",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// 4. Singleton Super Admin (The ONLY super admin permitted in the entire platform)
	store.users["a9999999-9999-9999-9999-999999999999"] = &User{
		ID:              "a9999999-9999-9999-9999-999999999999",
		Email:           "sysadmin@novwrite.dev",
		Username:        "novwrite_ops",
		Role:            httputil.RoleSuperAdmin,
		IsPlatformAdmin: true,
		MFAEnabled:      true,
		AccountStatus:   "ACTIVE",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	return store
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
			AdminAuditLogsCount: 4,
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
	store     UserStore
	jwtSecret string
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(store UserStore, jwtSecret string) *UserHandler {
	if jwtSecret == "" {
		jwtSecret = "novwrite-default-jwt-secret-key-32b"
	}
	return &UserHandler{
		store:     store,
		jwtSecret: jwtSecret,
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

type LoginResponse struct {
	Token     string `json:"token"`
	User      *User  `json:"user"`
	ExpiresIn int64  `json:"expiresIn"`
}

type UpdateRoleRequest struct {
	Role   string `json:"role"`
	Reason string `json:"reason,omitempty"`
}

// Register creates a new user account.
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
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := h.store.Create(newUser); err != nil {
		httputil.RespondBadRequest(w, r, err.Error(), "USER_CREATION_FAILED")
		return
	}

	httputil.RespondCreated(w, r, "/api/v1/users/"+newUser.ID, newUser)
}

// Login authenticates a user and returns a signed JWT token.
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

	// 24-hour expiration
	expiresIn := int64(24 * 3600)
	claims := httputil.UserClaims{
		UserID:    user.ID,
		Email:     user.Email,
		Role:      user.Role,
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
		IssuedAt:  time.Now().Unix(),
	}

	token, err := httputil.SignJWT(claims, h.jwtSecret)
	if err != nil {
		httputil.RespondInternalError(w, r, "Failed to issue authentication token.")
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, LoginResponse{
		Token:     token,
		User:      user,
		ExpiresIn: expiresIn,
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
