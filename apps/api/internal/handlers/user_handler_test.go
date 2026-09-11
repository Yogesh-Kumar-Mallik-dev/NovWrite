package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/cache"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_TEST_USER_HANDLER_001

func TestUserHandler_RegisterAndLogin(t *testing.T) {
	store := NewInMemoryUserStore()
	sessionMgr := cache.NewMemorySessionManager()
	handler := NewUserHandler(store, sessionMgr, "test-secret-key-32b")

	// 1. Register new Standard User
	regPayload := `{"email":"new_author@novwrite.dev","username":"new_author","password":"securePassword123"}`
	reqReg := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBufferString(regPayload))
	recReg := httptest.NewRecorder()

	handler.Register(recReg, reqReg)
	if recReg.Code != http.StatusCreated {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 201 Created, got %d: %s", recReg.Code, recReg.Body.String())
	}

	var regResp httputil.SingleResponse
	if err := json.Unmarshal(recReg.Body.Bytes(), &regResp); err != nil {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: failed to parse response: %v", err)
	}

	regData, ok := regResp.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected valid map response")
	}
	userData := regData["user"].(map[string]interface{})
	if userData["role"] != "USER" {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected role USER, got %v", userData["role"])
	}

	// 2. Login with registered user
	loginPayload := `{"emailOrUsername":"new_author","password":"securePassword123"}`
	reqLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(loginPayload))
	recLogin := httptest.NewRecorder()

	handler.Login(recLogin, reqLogin)
	if recLogin.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for login, got %d: %s", recLogin.Code, recLogin.Body.String())
	}

	var loginResp httputil.SingleResponse
	if err := json.Unmarshal(recLogin.Body.Bytes(), &loginResp); err != nil {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: failed to parse login response: %v", err)
	}

	loginData := loginResp.Data.(map[string]interface{})
	token, ok := loginData["token"].(string)
	refreshToken, okRef := loginData["refreshToken"].(string)
	if !ok || token == "" || !okRef || refreshToken == "" {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected non-empty token and refreshToken")
	}

	// 3. Call Me endpoint with claims context
	reqMe := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	ctx := httputil.SetUserInContext(reqMe.Context(), &httputil.UserClaims{
		UserID: userData["id"].(string),
		Email:  "new_author@novwrite.dev",
		Role:   "USER",
	})
	recMe := httptest.NewRecorder()

	handler.Me(recMe, reqMe.WithContext(ctx))
	if recMe.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for Me, got %d: %s", recMe.Code, recMe.Body.String())
	}

	// 4. Refresh Token endpoint
	refreshPayload := fmt.Sprintf(`{"refreshToken":"%s"}`, refreshToken)
	reqRef := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", bytes.NewBufferString(refreshPayload))
	recRef := httptest.NewRecorder()

	handler.RefreshToken(recRef, reqRef)
	if recRef.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for refresh, got %d: %s", recRef.Code, recRef.Body.String())
	}

	var refreshedResp httputil.SingleResponse
	_ = json.Unmarshal(recRef.Body.Bytes(), &refreshedResp)
	refreshedData := refreshedResp.Data.(map[string]interface{})
	newToken := refreshedData["token"].(string)
	newRefreshToken := refreshedData["refreshToken"].(string)
	if newToken == "" || newRefreshToken == "" || newRefreshToken == refreshToken {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected rotated refresh token")
	}

	// 5. Change Password
	changePwdPayload := `{"oldPassword":"securePassword123","newPassword":"newSecurePassword456"}`
	reqChange := httptest.NewRequest(http.MethodPost, "/api/v1/auth/password", bytes.NewBufferString(changePwdPayload))
	recChange := httptest.NewRecorder()

	handler.ChangePassword(recChange, reqChange.WithContext(ctx))
	if recChange.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for change password, got %d: %s", recChange.Code, recChange.Body.String())
	}

	// 6. Login with new password
	loginNewPayload := `{"emailOrUsername":"new_author","password":"newSecurePassword456"}`
	reqLoginNew := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(loginNewPayload))
	recLoginNew := httptest.NewRecorder()

	handler.Login(recLoginNew, reqLoginNew)
	if recLoginNew.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for login with new password, got %d", recLoginNew.Code)
	}

	// 7. Logout
	reqLogout := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", bytes.NewBufferString(fmt.Sprintf(`{"refreshToken":"%s"}`, newRefreshToken)))
	recLogout := httptest.NewRecorder()

	handler.Logout(recLogout, reqLogout.WithContext(ctx))
	if recLogout.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for logout, got %d", recLogout.Code)
	}
}

func TestUserHandler_RoleHierarchyAndGuards(t *testing.T) {
	store := NewInMemoryUserStore()
	sessionMgr := cache.NewMemorySessionManager()
	handler := NewUserHandler(store, sessionMgr, "test-secret-key-32b")

	targetUser := &User{
		ID:            "test-user-1",
		Email:         "author@test.internal",
		Username:      "author_test",
		Role:          httputil.RoleUser,
		AccountStatus: "ACTIVE",
	}
	superUser := &User{
		ID:            "test-super-1",
		Email:         "super@test.internal",
		Username:      "super_test",
		Role:          httputil.RoleSuperAdmin,
		AccountStatus: "ACTIVE",
	}
	_ = store.Create(targetUser)
	_ = store.Create(superUser)

	// 1. Non-superadmin cannot self-assign ADMIN role during registration
	regAdminPayload := `{"email":"sneaky_admin@test.internal","username":"sneaky","role":"ADMIN"}`
	reqRegAdmin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBufferString(regAdminPayload))
	recRegAdmin := httptest.NewRecorder()

	handler.Register(recRegAdmin, reqRegAdmin)
	if recRegAdmin.Code != http.StatusForbidden {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 403 Forbidden for unprivileged admin registration, got %d", recRegAdmin.Code)
	}

	// 2. SuperAdmin can promote standard user to ADMIN
	promotePayload := `{"role":"ADMIN","reason":"Promoted to community manager"}`
	reqPromote := httptest.NewRequest(http.MethodPut, "/api/v1/admin/users/test-user-1/role", bytes.NewBufferString(promotePayload))

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("userId", "test-user-1")
	ctx := context.WithValue(reqPromote.Context(), chi.RouteCtxKey, rctx)
	ctx = httputil.SetUserInContext(ctx, &httputil.UserClaims{
		UserID: "test-super-1",
		Role:   httputil.RoleSuperAdmin,
	})

	recPromote := httptest.NewRecorder()
	handler.UpdateUserRole(recPromote, reqPromote.WithContext(ctx))

	if recPromote.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for role promotion, got %d: %s", recPromote.Code, recPromote.Body.String())
	}

	// Verify updated user
	updatedUser, err := store.GetByID("test-user-1")
	if err != nil || updatedUser.Role != httputil.RoleAdmin {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected user role ADMIN, got %s", updatedUser.Role)
	}
}

func TestUserHandler_SingletonSuperAdmin_Enforcement(t *testing.T) {
	store := NewInMemoryUserStore()
	sessionMgr := cache.NewMemorySessionManager()
	handler := NewUserHandler(store, sessionMgr, "test-secret-key-32b")

	standardUser := &User{
		ID:            "test-user-1",
		Email:         "standard@test.internal",
		Username:      "standard_test",
		Role:          httputil.RoleUser,
		AccountStatus: "ACTIVE",
	}
	superUser := &User{
		ID:            "test-super-1",
		Email:         "super@test.internal",
		Username:      "super_test",
		Role:          httputil.RoleSuperAdmin,
		AccountStatus: "ACTIVE",
	}
	_ = store.Create(standardUser)
	_ = store.Create(superUser)

	// 1. Prohibit registering SUPER_ADMIN via HTTP API
	regSuperPayload := `{"email":"imposter_super@test.internal","username":"imposter","role":"SUPER_ADMIN"}`
	reqRegSuper := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBufferString(regSuperPayload))
	recRegSuper := httptest.NewRecorder()

	handler.Register(recRegSuper, reqRegSuper)
	if recRegSuper.Code != http.StatusForbidden {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 403 Forbidden when registering SUPER_ADMIN via HTTP, got %d", recRegSuper.Code)
	}

	// 2. Direct store reject creating a second SUPER_ADMIN
	errCreate := store.Create(&User{
		ID:       "imposter-super-id",
		Email:    "imposter2@test.internal",
		Username: "imposter2",
		Role:     httputil.RoleSuperAdmin,
	})
	if errCreate == nil {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected error creating second SUPER_ADMIN, got nil")
	}

	// 3. Reject promoting another user to SUPER_ADMIN
	errPromote := store.UpdateRole("test-user-1", httputil.RoleSuperAdmin)
	if errPromote == nil {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected error promoting second user to SUPER_ADMIN, got nil")
	}

	// 4. Reject deleting the designated Singleton Super Admin
	errDelete := store.Delete("test-super-1")
	if errDelete == nil {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected error deleting singleton Super Admin, got nil")
	}
}

func TestUserHandler_SuperAdminDashboard(t *testing.T) {
	store := NewInMemoryUserStore()
	sessionMgr := cache.NewMemorySessionManager()
	handler := NewUserHandler(store, sessionMgr, "test-secret-key-32b")

	superUser := &User{
		ID:            "test-super-1",
		Email:         "super@test.internal",
		Username:      "super_test",
		Role:          httputil.RoleSuperAdmin,
		AccountStatus: "ACTIVE",
	}
	_ = store.Create(superUser)

	// 1. Super Admin access to dashboard -> 200 OK
	req := httptest.NewRequest(http.MethodGet, "/api/v1/superadmin/dashboard", nil)
	ctx := httputil.SetUserInContext(req.Context(), &httputil.UserClaims{
		UserID: "test-super-1",
		Role:   httputil.RoleSuperAdmin,
	})
	rec := httptest.NewRecorder()

	handler.SuperAdminDashboard(rec, req.WithContext(ctx))
	if rec.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for SuperAdminDashboard, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp httputil.SingleResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: failed to parse dashboard response: %v", err)
	}

	dataMap, ok := resp.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected valid map data")
	}

	userMetrics := dataMap["userMetrics"].(map[string]interface{})
	if int(userMetrics["superAdminUsers"].(float64)) != 1 {
		t.Errorf("BLOCK_TEST_USER_HANDLER_001: expected exactly 1 super admin user, got %v", userMetrics["superAdminUsers"])
	}

	// 2. Guard RequireSuperAdmin blocks ADMIN and USER
	superMiddleware := httputil.RequireSuperAdmin()
	protectedDashboard := superMiddleware(http.HandlerFunc(handler.SuperAdminDashboard))

	// ADMIN -> 403
	reqAdmin := httptest.NewRequest(http.MethodGet, "/superadmin", nil)
	ctxAdmin := httputil.SetUserInContext(reqAdmin.Context(), &httputil.UserClaims{
		UserID: "admin_1",
		Role:   httputil.RoleAdmin,
	})
	recAdmin := httptest.NewRecorder()
	protectedDashboard.ServeHTTP(recAdmin, reqAdmin.WithContext(ctxAdmin))

	if recAdmin.Code != http.StatusForbidden {
		t.Errorf("BLOCK_TEST_USER_HANDLER_001: expected 403 Forbidden for ADMIN attempting to access SuperAdminDashboard, got %d", recAdmin.Code)
	}
}

func TestUserHandler_RequireRoleMiddlewares(t *testing.T) {
	// Test RequireAdmin middleware blocks standard USER
	adminMiddleware := httputil.RequireAdmin()
	protectedHandler := adminMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Standard User -> 403
	reqUser := httptest.NewRequest(http.MethodGet, "/admin", nil)
	ctxUser := httputil.SetUserInContext(reqUser.Context(), &httputil.UserClaims{
		UserID: "user_1",
		Role:   httputil.RoleUser,
	})
	recUser := httptest.NewRecorder()
	protectedHandler.ServeHTTP(recUser, reqUser.WithContext(ctxUser))

	if recUser.Code != http.StatusForbidden {
		t.Errorf("BLOCK_TEST_USER_HANDLER_001: expected 403 Forbidden for standard user, got %d", recUser.Code)
	}

	// Admin User -> 200
	reqAdmin := httptest.NewRequest(http.MethodGet, "/admin", nil)
	ctxAdmin := httputil.SetUserInContext(reqAdmin.Context(), &httputil.UserClaims{
		UserID: "admin_1",
		Role:   httputil.RoleAdmin,
	})
	recAdmin := httptest.NewRecorder()
	protectedHandler.ServeHTTP(recAdmin, reqAdmin.WithContext(ctxAdmin))

	if recAdmin.Code != http.StatusOK {
		t.Errorf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for admin, got %d", recAdmin.Code)
	}

	// Super Admin -> 200
	reqSuper := httptest.NewRequest(http.MethodGet, "/admin", nil)
	ctxSuper := httputil.SetUserInContext(reqSuper.Context(), &httputil.UserClaims{
		UserID: "super_1",
		Role:   httputil.RoleSuperAdmin,
	})
	recSuper := httptest.NewRecorder()
	protectedHandler.ServeHTTP(recSuper, reqSuper.WithContext(ctxSuper))

	if recSuper.Code != http.StatusOK {
		t.Errorf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for super admin, got %d", recSuper.Code)
	}
}

func TestUserHandler_SuperAdminLogin(t *testing.T) {
	store := NewInMemoryUserStore()
	sessionMgr := cache.NewMemorySessionManager()
	handler := NewUserHandler(store, sessionMgr, "test-secret-key-32b")

	standardUser := &User{
		ID:            "test-user-1",
		Email:         "author@test.internal",
		Username:      "standard_author",
		Role:          httputil.RoleUser,
		AccountStatus: "ACTIVE",
	}
	superUser := &User{
		ID:            "test-super-1",
		Email:         "superadmin@test.internal",
		Username:      "root_superadmin",
		Role:          httputil.RoleSuperAdmin,
		AccountStatus: "ACTIVE",
	}
	_ = store.Create(standardUser)
	_ = store.Create(superUser)

	// 1. Valid Super Admin username login
	loginSuperPayload := `{"emailOrUsername":"root_superadmin","password":"any_password"}`
	reqValid := httptest.NewRequest(http.MethodPost, "/api/v1/superadmin/login", bytes.NewBufferString(loginSuperPayload))
	recValid := httptest.NewRecorder()

	handler.SuperAdminLogin(recValid, reqValid)
	if recValid.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for valid super admin login, got %d: %s", recValid.Code, recValid.Body.String())
	}

	var loginResp httputil.SingleResponse
	if err := json.Unmarshal(recValid.Body.Bytes(), &loginResp); err != nil {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: failed to parse response: %v", err)
	}
	respMap := loginResp.Data.(map[string]interface{})
	if respMap["token"] == "" {
		t.Errorf("BLOCK_TEST_USER_HANDLER_001: expected non-empty token")
	}

	// 2. Valid Super Admin email login
	loginEmailPayload := `{"emailOrUsername":"superadmin@test.internal","password":"any_password"}`
	reqEmail := httptest.NewRequest(http.MethodPost, "/api/v1/superadmin/login", bytes.NewBufferString(loginEmailPayload))
	recEmail := httptest.NewRecorder()

	handler.SuperAdminLogin(recEmail, reqEmail)
	if recEmail.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for email login, got %d: %s", recEmail.Code, recEmail.Body.String())
	}

	// 3. Standard USER attempting Super Admin login -> 403 Forbidden
	loginUserPayload := `{"emailOrUsername":"author@test.internal","password":"any_password"}`
	reqUser := httptest.NewRequest(http.MethodPost, "/api/v1/superadmin/login", bytes.NewBufferString(loginUserPayload))
	recUser := httptest.NewRecorder()

	handler.SuperAdminLogin(recUser, reqUser)
	if recUser.Code != http.StatusForbidden {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 403 Forbidden for standard user on superadmin login, got %d", recUser.Code)
	}

	// 4. Non-existent user -> 401 Unauthorized
	loginNonExistent := `{"emailOrUsername":"ghost_user@test.internal","password":"any_password"}`
	reqNonExistent := httptest.NewRequest(http.MethodPost, "/api/v1/superadmin/login", bytes.NewBufferString(loginNonExistent))
	recNonExistent := httptest.NewRecorder()

	handler.SuperAdminLogin(recNonExistent, reqNonExistent)
	if recNonExistent.Code != http.StatusUnauthorized {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 401 Unauthorized for non-existent user, got %d", recNonExistent.Code)
	}
}

