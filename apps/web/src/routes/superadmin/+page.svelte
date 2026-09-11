<script lang="ts">
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import {
    ShieldAlert,
    ShieldCheck,
    Users,
    Cpu,
    KeyRound,
    Terminal,
    RefreshCw,
    Activity,
    Lock,
    Unlock,
    ExternalLink,
    LogIn,
    LogOut,
    AlertCircle,
    Copy,
    Check,
  } from "lucide-svelte";

  // Block Standard: BLOCK_PAGE_SUPER_ADMIN_DASHBOARD_002
  // Purpose: Strict Username/Password Protected Control Plane for the Singleton Super Admin.

  interface PlatformMetrics {
    version: string;
    environment: string;
    goVersion: string;
    serverTime: string;
    goroutines: number;
    systemPlatform: string;
  }

  interface UserMetrics {
    totalUsers: number;
    standardUsers: number;
    adminUsers: number;
    superAdminUsers: number;
    activeUsers: number;
    suspendedUsers: number;
  }

  interface SingletonSuperAdmin {
    id: string;
    email: string;
    username: string;
    role: string;
    isPlatformAdmin: boolean;
    mfaEnabled: boolean;
    accountStatus: string;
    createdAt: string;
  }

  interface SecurityStatus {
    rateLimiterActive: boolean;
    rateLimitRpm: number;
    payloadLimitBytes: number;
    singletonSuperAdmin: boolean;
    adminAuditLogsCount: number;
  }

  interface DashboardData {
    platformInfo: PlatformMetrics;
    userMetrics: UserMetrics;
    singletonSuperAdmin: SingletonSuperAdmin | null;
    securityStatus: SecurityStatus;
  }

  let isAuthenticated = $state(false);
  let isAuthenticating = $state(false);
  let loadingDashboard = $state(false);
  let dashboard = $state<DashboardData | null>(null);
  let authError = $state<string | null>(null);
  let tokenCopied = $state(false);

  // Login form state
  let emailOrUsername = $state("");
  let password = $state("");
  let manualToken = $state("");
  let showManualTokenInput = $state(false);

  const fallbackDashboard: DashboardData = {
    platformInfo: {
      version: "2.8",
      environment: "production",
      goVersion: "go1.23+",
      serverTime: new Date().toISOString(),
      goroutines: 8,
      systemPlatform: "linux",
    },
    userMetrics: {
      totalUsers: 0,
      standardUsers: 0,
      adminUsers: 0,
      superAdminUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
    },
    singletonSuperAdmin: null,
    securityStatus: {
      rateLimiterActive: true,
      rateLimitRpm: 300,
      payloadLimitBytes: 10485760,
      singletonSuperAdmin: false,
      adminAuditLogsCount: 0,
    },
  };

  async function handleSuperAdminLogin(e?: Event) {
    if (e) e.preventDefault();
    authError = null;
    isAuthenticating = true;

    try {
      if (showManualTokenInput && manualToken.trim()) {
        localStorage.setItem("novwrite_superadmin_token", manualToken.trim());
        await fetchDashboardData();
        return;
      }

      if (!emailOrUsername.trim()) {
        authError = "Super Admin username or email is required.";
        isAuthenticating = false;
        return;
      }

      const res = await fetch("http://localhost:8080/api/v1/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: emailOrUsername.trim(),
          password: password.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const token = json.data?.token || json.token;
        if (token) {
          localStorage.setItem("novwrite_superadmin_token", token);
        }
        isAuthenticated = true;
        await fetchDashboardData();
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson?.detail) {
          authError = errJson.detail;
        } else if (res.status === 403) {
          authError = "Access denied: Account is not the designated Singleton Super Admin.";
        } else {
          authError = "Invalid Super Admin credentials. Please check your username and password.";
        }
      }
    } catch {
      authError = "Could not connect to API server. Ensure backend is running.";
    } finally {
      isAuthenticating = false;
    }
  }

  async function fetchDashboardData() {
    loadingDashboard = true;
    try {
      const token = localStorage.getItem("novwrite_superadmin_token") || "";
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("http://localhost:8080/api/v1/superadmin/dashboard", { headers });
      if (res.ok) {
        const json = await res.json();
        dashboard = json.data || fallbackDashboard;
        isAuthenticated = true;
      } else if (res.status === 401 || res.status === 403) {
        isAuthenticated = false;
        localStorage.removeItem("novwrite_superadmin_token");
        authError = "Super Admin session expired or invalid. Please log in again.";
      } else {
        dashboard = fallbackDashboard;
        isAuthenticated = true;
      }
    } catch {
      if (isAuthenticated) {
        dashboard = fallbackDashboard;
      }
    } finally {
      loadingDashboard = false;
    }
  }

  function handleLogout() {
    localStorage.removeItem("novwrite_superadmin_token");
    isAuthenticated = false;
    dashboard = null;
    password = "";
    manualToken = "";
  }

  function copyCliCommand(cmd: string) {
    navigator.clipboard.writeText(cmd);
    tokenCopied = true;
    setTimeout(() => (tokenCopied = false), 2000);
  }

  onMount(() => {
    const existingToken = localStorage.getItem("novwrite_superadmin_token");
    if (existingToken) {
      fetchDashboardData();
    }
  });
</script>

<svelte:head>
  <title>Super Admin Control Plane | NovWrite</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground flex flex-col">
  <!-- Top Navigation Header -->
  <header class="border-b border-border bg-card sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
          <ShieldAlert class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-semibold tracking-tight truncate">
              Super Admin Control Plane
            </h1>
            <span class="text-xs font-mono font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              SINGLETON ROOT
            </span>
          </div>
          <p class="text-xs text-muted-foreground truncate">
            Protected Backend Host Management & System Telemetry
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        {#if isAuthenticated}
          <button
            onclick={fetchDashboardData}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors"
          >
            <RefreshCw class="w-3.5 h-3.5 {loadingDashboard ? 'animate-spin' : ''}" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
          <button
            onclick={handleLogout}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-500/20 text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        {/if}
        <a
          href="/world"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          <span>Lore Studio</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content View -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if !isAuthenticated}
      <!-- Super Admin Login Gate Screen -->
      <div class="max-w-md mx-auto py-12" in:fade={{ duration: 180 }}>
        <div class="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          <!-- Banner Header -->
          <div class="p-6 border-b border-border bg-muted/30 text-center space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
              <Lock class="w-6 h-6" />
            </div>
            <h2 class="text-lg font-semibold tracking-tight">Super Admin Authentication</h2>
            <p class="text-xs text-muted-foreground max-w-xs mx-auto">
              This dashboard is strictly restricted to the designated Singleton Super Admin account.
            </p>
          </div>

          <!-- Login Form -->
          <form onsubmit={handleSuperAdminLogin} class="p-6 space-y-4">
            {#if authError}
              <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2" in:scale>
                <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            {/if}

            {#if !showManualTokenInput}
              <div class="space-y-1.5">
                <label for="sa-username" class="text-xs font-medium text-foreground">
                  Super Admin Email or Username
                </label>
                <input
                  id="sa-username"
                  type="text"
                  bind:value={emailOrUsername}
                  placeholder="Enter Super Admin username or email"
                  required
                  class="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="sa-password" class="text-xs font-medium text-foreground">
                    Password / Master Passkey
                  </label>
                  <button
                    type="button"
                    onclick={() => (showManualTokenInput = true)}
                    class="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Use CLI Root Token
                  </button>
                </div>
                <input
                  id="sa-password"
                  type="password"
                  bind:value={password}
                  placeholder="Enter password or press unlock"
                  class="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            {:else}
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="sa-token" class="text-xs font-medium text-foreground">
                    CLI Root Token (Generated via Go CLI)
                  </label>
                  <button
                    type="button"
                    onclick={() => (showManualTokenInput = false)}
                    class="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Use Username & Password
                  </button>
                </div>
                <textarea
                  id="sa-token"
                  bind:value={manualToken}
                  rows={4}
                  placeholder="Paste JWT root token generated via 'go run ./cmd/admin-cli token'"
                  class="w-full p-3 text-xs font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                ></textarea>
                <p class="text-[11px] text-muted-foreground">
                  Generate on server: <code class="font-mono bg-muted px-1 rounded">go run ./cmd/admin-cli token</code>
                </p>
              </div>
            {/if}

            <button
              type="submit"
              disabled={isAuthenticating}
              class="w-full h-11 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {#if isAuthenticating}
                <RefreshCw class="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              {:else}
                <Unlock class="w-4 h-4" />
                <span>Unlock Super Admin Dashboard</span>
              {/if}
            </button>
          </form>
        </div>
      </div>
    {:else if dashboard}
      <!-- Authenticated Super Admin Dashboard Content -->
      <div class="space-y-6" in:fade={{ duration: 180 }}>
        <!-- Singleton Status Alert Banner -->
        <div class="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 mt-0.5">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-foreground">
                Authenticated Singleton Super Admin Control Plane
              </h2>
              <p class="text-xs text-muted-foreground mt-0.5">
                NovWrite enforces exactly one Super Admin across the entire system. Access is strictly managed via username & password and the Go server CLI (<code class="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">apps/api/cmd/admin-cli</code>).
              </p>
            </div>
          </div>
          {#if dashboard.singletonSuperAdmin}
            <div class="text-left sm:text-right shrink-0">
              <div class="text-xs font-mono font-medium text-foreground">
                {dashboard.singletonSuperAdmin.username}
              </div>
              <div class="text-xs text-muted-foreground">
                {dashboard.singletonSuperAdmin.email}
              </div>
            </div>
          {/if}
        </div>

        <!-- Metric Grid Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Users -->
          <div class="p-4 rounded-xl border border-border bg-card/60 flex flex-col justify-between">
            <div class="flex items-center justify-between text-muted-foreground">
              <span class="text-xs font-medium uppercase tracking-wider">Total Accounts</span>
              <Users class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold">{dashboard.userMetrics.totalUsers}</div>
              <div class="text-xs text-muted-foreground mt-1">
                {dashboard.userMetrics.standardUsers} Authors · {dashboard.userMetrics.adminUsers} Admins
              </div>
            </div>
          </div>

          <!-- Singleton Super Admin -->
          <div class="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 flex flex-col justify-between">
            <div class="flex items-center justify-between text-purple-600 dark:text-purple-400">
              <span class="text-xs font-medium uppercase tracking-wider">Super Admin</span>
              <KeyRound class="w-4 h-4" />
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {dashboard.userMetrics.superAdminUsers} / 1
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                Enforced Singleton Constraint
              </div>
            </div>
          </div>

          <!-- Platform Runtime -->
          <div class="p-4 rounded-xl border border-border bg-card/60 flex flex-col justify-between">
            <div class="flex items-center justify-between text-muted-foreground">
              <span class="text-xs font-medium uppercase tracking-wider">Runtime & Goroutines</span>
              <Cpu class="w-4 h-4 text-blue-500" />
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold">{dashboard.platformInfo.goroutines}</div>
              <div class="text-xs text-muted-foreground mt-1">
                Go {dashboard.platformInfo.goVersion} ({dashboard.platformInfo.systemPlatform})
              </div>
            </div>
          </div>

          <!-- Protection & Rate Limiting -->
          <div class="p-4 rounded-xl border border-border bg-card/60 flex flex-col justify-between">
            <div class="flex items-center justify-between text-muted-foreground">
              <span class="text-xs font-medium uppercase tracking-wider">Defense Status</span>
              <Activity class="w-4 h-4 text-emerald-500" />
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Active</div>
              <div class="text-xs text-muted-foreground mt-1">
                {dashboard.securityStatus.rateLimitRpm} req/min · 10MB Payload Cap
              </div>
            </div>
          </div>
        </div>

        <!-- Super Admin Go Server CLI Control Plane Section -->
        <div class="rounded-xl border border-border bg-card/60 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Terminal class="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 class="text-sm font-semibold">Backend Server CLI Quick Reference</h3>
            </div>
            <span class="text-xs font-mono text-muted-foreground">Host Shell</span>
          </div>

          <p class="text-xs text-muted-foreground">
            Execute these commands on the backend server terminal to manage the Super Admin singleton and inspect root platform state:
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div class="p-3 rounded-lg bg-muted/60 border border-border flex items-center justify-between">
              <span class="text-foreground">go run ./cmd/admin-cli status</span>
              <button
                onclick={() => copyCliCommand("go run ./cmd/admin-cli status")}
                class="px-2 py-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Copy
              </button>
            </div>

            <div class="p-3 rounded-lg bg-muted/60 border border-border flex items-center justify-between">
              <span class="text-foreground">go run ./cmd/admin-cli token</span>
              <button
                onclick={() => copyCliCommand("go run ./cmd/admin-cli token")}
                class="px-2 py-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Copy
              </button>
            </div>

            <div class="p-3 rounded-lg bg-muted/60 border border-border flex items-center justify-between">
              <span class="text-foreground">go run ./cmd/admin-cli list-users</span>
              <button
                onclick={() => copyCliCommand("go run ./cmd/admin-cli list-users")}
                class="px-2 py-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Copy
              </button>
            </div>

            <div class="p-3 rounded-lg bg-muted/60 border border-border flex items-center justify-between">
              <span class="text-foreground">go run ./cmd/admin-cli promote &lt;email&gt;</span>
              <button
                onclick={() => copyCliCommand("go run ./cmd/admin-cli promote ")}
                class="px-2 py-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {#if tokenCopied}
            <p class="text-xs text-emerald-500 font-medium" in:scale>
              ✅ Command copied to clipboard!
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </main>
</div>
