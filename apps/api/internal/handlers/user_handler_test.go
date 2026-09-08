package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_TEST_USER_HANDLER_001

func TestUserHandler_RegisterAndLogin(t *testing.T) {
	store := NewInMemoryUserStore()
	handler := NewUserHandler(store, "test-secret-key-32b")

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

	userData, ok := regResp.Data.(map[string]interface{})
	if !ok || userData["role"] != "USER" {
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
	if !ok || token == "" {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected non-empty token")
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
}

func TestUserHandler_RoleHierarchyAndGuards(t *testing.T) {
	store := NewInMemoryUserStore()
	handler := NewUserHandler(store, "test-secret-key-32b")

	// 1. Non-superadmin cannot self-assign ADMIN role during registration
	regAdminPayload := `{"email":"sneaky_admin@novwrite.dev","username":"sneaky","role":"ADMIN"}`
	reqRegAdmin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBufferString(regAdminPayload))
	recRegAdmin := httptest.NewRecorder()

	handler.Register(recRegAdmin, reqRegAdmin)
	if recRegAdmin.Code != http.StatusForbidden {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 403 Forbidden for unprivileged admin registration, got %d", recRegAdmin.Code)
	}

	// 2. SuperAdmin can promote standard user to ADMIN
	promotePayload := `{"role":"ADMIN","reason":"Promoted to community manager"}`
	reqPromote := httptest.NewRequest(http.MethodPut, "/api/v1/admin/users/a1111111-1111-1111-1111-111111111111/role", bytes.NewBufferString(promotePayload))

	// Attach chi URLParam
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("userId", "a1111111-1111-1111-1111-111111111111")
	ctx := context.WithValue(reqPromote.Context(), chi.RouteCtxKey, rctx)
	ctx = httputil.SetUserInContext(ctx, &httputil.UserClaims{
		UserID: "a9999999-9999-9999-9999-999999999999",
		Role:   httputil.RoleSuperAdmin,
	})

	recPromote := httptest.NewRecorder()
	handler.UpdateUserRole(recPromote, reqPromote.WithContext(ctx))

	if recPromote.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected 200 OK for role promotion, got %d: %s", recPromote.Code, recPromote.Body.String())
	}

	// Verify updated user
	updatedUser, err := store.GetByID("a1111111-1111-1111-1111-111111111111")
	if err != nil || updatedUser.Role != httputil.RoleAdmin {
		t.Fatalf("BLOCK_TEST_USER_HANDLER_001: expected user role ADMIN, got %s", updatedUser.Role)
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
