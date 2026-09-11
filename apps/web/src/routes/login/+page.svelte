<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { authStore } from "$lib/stores/projectStore.svelte";
  import {
    LogIn,
    User,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowRight,
    Shield,
  } from "lucide-svelte";

  let identifier = $state("");
  let password = $state("");
  let showPassword = $state(false);
  let rememberMe = $state(true);
  let errorMsg = $state<string | null>(null);

  // If already authenticated, redirect
  $effect(() => {
    if (authStore.isAuthenticated && authStore.isInitialized) {
      const redirect = page.url.searchParams.get("redirect") || "/novel";
      goto(redirect);
    }
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      errorMsg = "Please enter your email or username.";
      return;
    }
    if (!password) {
      errorMsg = "Please enter your password.";
      return;
    }

    errorMsg = null;
    const success = await authStore.login({
      emailOrUsername: identifier.trim(),
      password: password,
    });

    if (success) {
      const redirect = page.url.searchParams.get("redirect") || "/novel";
      goto(redirect);
    } else {
      errorMsg = "Invalid email/username or password. Please try again.";
    }
  }
</script>

<svelte:head>
  <title>Sign In | NovWrite</title>
</svelte:head>

<div class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-background text-foreground transition-colors min-h-[calc(100vh-3.5rem)]">
  <div class="w-full max-w-md space-y-6">
    <!-- Header / Brand -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xs mb-1">
        <img src="/logo.png" alt="NovWrite" class="w-8 h-8 rounded-lg object-contain" />
      </div>
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Welcome back to NovWrite
      </h1>
      <p class="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
        Sign in to access your creative novel universes, blueprints, and manuscripts.
      </p>
    </div>

    <!-- Login Card -->
    <div class="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-lg space-y-5">
      {#if errorMsg}
        <div class="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <div class="flex-1 font-medium leading-relaxed">{errorMsg}</div>
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-4">
        <!-- Email or Username -->
        <div class="space-y-1.5">
          <label for="identifier" class="block text-xs font-semibold text-foreground">
            Email or Username
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <User class="w-4 h-4" />
            </div>
            <input
              id="identifier"
              type="text"
              bind:value={identifier}
              placeholder="e.g. author or author@novwrite.dev"
              autocomplete="username"
              required
              class="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[42px] transition-colors"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label for="password" class="block text-xs font-semibold text-foreground">
              Password
            </label>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock class="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              bind:value={password}
              placeholder="Enter your password"
              autocomplete="current-password"
              required
              class="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[42px] transition-colors"
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {#if showPassword}
                <EyeOff class="w-4 h-4" />
              {:else}
                <Eye class="w-4 h-4" />
              {/if}
            </button>
          </div>
        </div>

        <!-- Remember Me Checkbox -->
        <div class="flex items-center justify-between pt-1">
          <label class="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground select-none">
            <input
              type="checkbox"
              bind:checked={rememberMe}
              class="rounded border-input text-primary focus:ring-primary/20"
            />
            <span>Remember this device</span>
          </label>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={authStore.isLoading || !identifier.trim() || !password}
          class="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
        >
          {#if authStore.isLoading}
            <div class="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
            <span>Signing in...</span>
          {:else}
            <LogIn class="w-4 h-4" />
            <span>Sign In</span>
          {/if}
        </button>
      </form>
    </div>

    <!-- Sign Up Callout -->
    <div class="text-center text-xs text-muted-foreground">
      <span>Don't have an account yet?</span>
      <a
        href="/register"
        class="ml-1 font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
      >
        <span>Create an account</span>
        <ArrowRight class="w-3 h-3" />
      </a>
    </div>

    <!-- Security & Privacy Note -->
    <div class="text-center text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1.5 pt-2">
      <Shield class="w-3.5 h-3.5 text-muted-foreground/60" />
      <span>Protected by end-to-end multi-tenant session isolation.</span>
    </div>
  </div>
</div>
