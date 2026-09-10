package main

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/handlers"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
)

// Block Standard: BLOCK_CLI_SUPER_ADMIN_001
// Purpose: Backend-only Server CLI for managing the Singleton Super Admin, issuing root dashboard access tokens, and inspecting platform health.

func main() {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "novwrite-default-jwt-secret-key-32b"
	}

	store := handlers.NewInMemoryUserStore()

	if len(os.Args) < 2 {
		printUsage()
		return
	}

	command := strings.ToLower(os.Args[1])

	switch command {
	case "status":
		handleStatus(store)
	case "token":
		handleToken(store, jwtSecret)
	case "list-users":
		handleListUsers(store)
	case "bootstrap-superadmin", "init-superadmin":
		if len(os.Args) < 4 {
			fmt.Println("❌ Error: Missing email or username.")
			fmt.Println("Usage: go run ./apps/api/cmd/admin-cli bootstrap-superadmin <email> <username>")
			os.Exit(1)
		}
		handleBootstrapSuperAdmin(store, os.Args[2], os.Args[3])
	case "promote":
		if len(os.Args) < 3 {
			fmt.Println("❌ Error: Missing user identifier (email or username).")
			fmt.Println("Usage: go run ./apps/api/cmd/admin-cli promote <email_or_username>")
			os.Exit(1)
		}
		handlePromote(store, os.Args[2])
	case "demote":
		if len(os.Args) < 3 {
			fmt.Println("❌ Error: Missing user identifier (email or username).")
			fmt.Println("Usage: go run ./apps/api/cmd/admin-cli demote <email_or_username>")
			os.Exit(1)
		}
		handleDemote(store, os.Args[2])
	case "help", "--help", "-h":
		printUsage()
	default:
		fmt.Printf("❌ Unknown command '%s'. Run 'admin-cli help' for available commands.\n", command)
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println("================================================================")
	fmt.Println("  👑 NovWrite Backend Super Admin Server CLI")
	fmt.Println("  Exclusive backend control plane for the Singleton Super Admin")
	fmt.Println("================================================================")
	fmt.Println("Commands:")
	fmt.Println("  status                          Inspect Singleton Super Admin & platform telemetry")
	fmt.Println("  token                           Generate a root JWT token for the Super Admin Dashboard")
	fmt.Println("  list-users                      List all registered users, admins, and roles")
	fmt.Println("  bootstrap-superadmin <email> <username>  Initialize root Singleton Super Admin")
	fmt.Println("  promote <email/username>        Promote a standard USER to ADMIN")
	fmt.Println("  demote <email/username>         Demote an ADMIN to standard USER")
	fmt.Println("  help                            Display this help menu")
	fmt.Println("================================================================")
}

func handleStatus(store handlers.UserStore) {
	metrics, err := store.GetDashboardMetrics()
	if err != nil {
		fmt.Printf("❌ Failed to retrieve metrics: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("================================================================")
	fmt.Println("  👑 NOVWRITE SINGLETON SUPER ADMIN STATUS")
	fmt.Println("================================================================")
	if metrics.SingletonSuperAdmin != nil {
		fmt.Printf("  • Super Admin ID:       %s\n", metrics.SingletonSuperAdmin.ID)
		fmt.Printf("  • Email:                %s\n", metrics.SingletonSuperAdmin.Email)
		fmt.Printf("  • Username:             %s\n", metrics.SingletonSuperAdmin.Username)
		fmt.Printf("  • Role:                 %s (Singleton: %v)\n", metrics.SingletonSuperAdmin.Role, metrics.SecurityStatus.SingletonSuperAdmin)
		fmt.Printf("  • Status:               %s\n", metrics.SingletonSuperAdmin.AccountStatus)
	} else {
		fmt.Println("  ⚠️ No Super Admin found in the system!")
	}

	fmt.Println("\n📊 USER DISTRIBUTION:")
	fmt.Printf("  • Total Users:          %d\n", metrics.UserMetrics.TotalUsers)
	fmt.Printf("  • Standard Authors:     %d\n", metrics.UserMetrics.StandardUsers)
	fmt.Printf("  • Platform Admins:      %d\n", metrics.UserMetrics.AdminUsers)
	fmt.Printf("  • Super Admins:         %d (Enforced Singleton)\n", metrics.UserMetrics.SuperAdminUsers)

	fmt.Println("\n🛡️ PLATFORM TELEMETRY:")
	fmt.Printf("  • Version:              %s\n", metrics.PlatformInfo.Version)
	fmt.Printf("  • Environment:          %s\n", metrics.PlatformInfo.Environment)
	fmt.Printf("  • Go Version:           %s\n", metrics.PlatformInfo.GoVersion)
	fmt.Printf("  • System Platform:      %s\n", metrics.PlatformInfo.SystemPlatform)
	fmt.Printf("  • Active Goroutines:    %d\n", metrics.PlatformInfo.Goroutines)
	fmt.Println("================================================================")
}

func handleToken(store handlers.UserStore, secret string) {
	superAdmin, err := store.GetSuperAdmin()
	if err != nil {
		fmt.Printf("❌ Failed to locate Singleton Super Admin: %v\n", err)
		os.Exit(1)
	}

	// Issue 7-day token for server admin dashboard
	claims := httputil.UserClaims{
		UserID:    superAdmin.ID,
		Email:     superAdmin.Email,
		Role:      httputil.RoleSuperAdmin,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour).Unix(),
		IssuedAt:  time.Now().Unix(),
	}

	token, err := httputil.SignJWT(claims, secret)
	if err != nil {
		fmt.Printf("❌ Failed to sign Super Admin token: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("================================================================")
	fmt.Println("  🔑 SUPER ADMIN ROOT DASHBOARD TOKEN")
	fmt.Println("================================================================")
	fmt.Printf("User:    %s (%s)\n", superAdmin.Username, superAdmin.Email)
	fmt.Printf("Role:    %s\n", superAdmin.Role)
	fmt.Printf("Expires: %s (7 Days)\n\n", time.Unix(claims.ExpiresAt, 0).UTC().Format(time.RFC3339))
	fmt.Println("Bearer Token:")
	fmt.Println(token)
	fmt.Println("================================================================")
}

func handleListUsers(store handlers.UserStore) {
	users, total, err := store.List(httputil.PaginationParams{Page: 1, PageSize: 100}, "")
	if err != nil {
		fmt.Printf("❌ Failed to list users: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("================================================================")
	fmt.Printf("  👥 REGISTERED USERS & ROLES (Total: %d)\n", total)
	fmt.Println("================================================================")
	fmt.Printf("%-38s | %-16s | %-14s | %s\n", "USER ID", "USERNAME", "ROLE", "EMAIL")
	fmt.Println("-----------------------------------------------------------------------------------------")
	for _, u := range users {
		fmt.Printf("%-38s | %-16s | %-14s | %s\n", u.ID, u.Username, u.Role, u.Email)
	}
	fmt.Println("================================================================")
}

func handlePromote(store handlers.UserStore, identifier string) {
	user, err := store.GetByEmailOrUsername(identifier)
	if err != nil {
		fmt.Printf("❌ User '%s' not found.\n", identifier)
		os.Exit(1)
	}

	if user.Role == httputil.RoleSuperAdmin {
		fmt.Println("ℹ️ User is already the Singleton Super Admin.")
		return
	}

	if err := store.UpdateRole(user.ID, httputil.RoleAdmin); err != nil {
		fmt.Printf("❌ Failed to promote user: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("✅ Successfully promoted user '%s' (%s) to role 'ADMIN'.\n", user.Username, user.Email)
}

func handleDemote(store handlers.UserStore, identifier string) {
	user, err := store.GetByEmailOrUsername(identifier)
	if err != nil {
		fmt.Printf("❌ User '%s' not found.\n", identifier)
		os.Exit(1)
	}

	if user.Role == httputil.RoleSuperAdmin {
		fmt.Println("❌ Error: Cannot demote the Singleton Super Admin account.")
		os.Exit(1)
	}

	if err := store.UpdateRole(user.ID, httputil.RoleUser); err != nil {
		fmt.Printf("❌ Failed to demote user: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("✅ Successfully demoted user '%s' (%s) to role 'USER'.\n", user.Username, user.Email)
}

func handleBootstrapSuperAdmin(store handlers.UserStore, email, username string) {
	now := time.Now().UTC()
	superAdmin := &handlers.User{
		ID:              fmt.Sprintf("sa-%d", now.UnixNano()),
		Email:           strings.TrimSpace(email),
		Username:        strings.TrimSpace(username),
		Role:            httputil.RoleSuperAdmin,
		IsPlatformAdmin: true,
		MFAEnabled:      true,
		AccountStatus:   "ACTIVE",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := store.Create(superAdmin); err != nil {
		fmt.Printf("❌ Failed to initialize Singleton Super Admin: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("================================================================")
	fmt.Println("  👑 SINGLETON SUPER ADMIN INITIALIZED SUCCESSFULLY")
	fmt.Println("================================================================")
	fmt.Printf("  • ID:       %s\n", superAdmin.ID)
	fmt.Printf("  • Email:    %s\n", superAdmin.Email)
	fmt.Printf("  • Username: %s\n", superAdmin.Username)
	fmt.Printf("  • Role:     %s\n", superAdmin.Role)
	fmt.Println("================================================================")
}
