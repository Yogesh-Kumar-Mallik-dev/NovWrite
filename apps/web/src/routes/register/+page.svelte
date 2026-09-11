<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { authStore } from "$lib/stores/projectStore.svelte";
  import {
    UserPlus,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowRight,
    Check,
    Shield,
  } from "lucide-svelte";

  let username = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let showPassword = $state(false);
  let errorMsg = $state<string | null>(null);

  // If already authenticated, redirect
  $effect(() => {
    if (authStore.isAuthenticated && authStore.isInitialized) {
      const redirect = page.url.searchParams.get("redirect") || "/novel";
      goto(redirect);
    }
  });

  const passwordLengthOk = $derived(password.length >= 8);
  const passwordsMatch = $derived(password.length > 0 && password === confirmPassword);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!username.trim()) {
      errorMsg = "Please choose a username.";
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      errorMsg = "Please provide a valid email address.";
      return;
    }
    if (password.length < 8) {
      errorMsg = "Password must be at least 8 characters long.";
      return;
    }
    if (password !== confirmPassword) {
      errorMsg = "Passwords do not match.";
      return;
    }

    errorMsg = null;
    const success = await authStore.register({
      username: username.trim(),
      email: email.trim(),
      password: password,
      role: "USER",
    });

    if (success) {
      const redirect = page.url.searchParams.get("redirect") || "/novel";
      goto(redirect);
    } else {
      errorMsg = "Failed to create account. Username or email may already be taken.";
    }
  }
</script>

<svelte:head>
  <title>Create Account | NovWrite</title>
</svelte:head>

<div class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-background text-foreground transition-colors min-h-[calc(100vh-3.5rem)]">
  <div class="w-full max-w-md space-y-6">
    <!-- Header / Brand -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xs mb-1">
        <img src="/logo.png" alt="NovWrite" class="w-8 h-8 rounded-lg object-contain" />
      </div>
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Create your NovWrite account
      </h1>
      <p class="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
        Join the universe architect platform for novel authors and storytellers.
      </p>
    </div>

    <!-- Registration Card -->
    <div class="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-lg space-y-5">
      {#if errorMsg}
        <div class="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <div class="flex-1 font-medium leading-relaxed">{errorMsg}</div>
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-4">
        <!-- Username -->
        <div class="space-y-1.5">
          <label for="username" class="block text-xs font-semibold text-foreground">
            Username *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <User class="w-4 h-4" />
            </div>
            <input
              id="username"
              type="text"
              bind:value={username}
              placeholder="e.g. stormwriter"
              autocomplete="username"
              required
              class="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[42px] transition-colors"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label for="email" class="block text-xs font-semibold text-foreground">
            Email Address *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Mail class="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="author@domain.com"
              autocomplete="email"
              required
              class="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[42px] transition-colors"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label for="password" class="block text-xs font-semibold text-foreground">
            Password *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock class="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              bind:value={password}
              placeholder="At least 8 characters"
              autocomplete="new-password"
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

        <!-- Confirm Password -->
        <div class="space-y-1.5">
          <label for="confirm-password" class="block text-xs font-semibold text-foreground">
            Confirm Password *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock class="w-4 h-4" />
            </div>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              bind:value={confirmPassword}
              placeholder="Re-enter your password"
              autocomplete="new-password"
              required
              class="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[42px] transition-colors"
            />
          </div>
        </div>

        <!-- Password Helper Checklist -->
        {#if password}
          <div class="p-3 rounded-lg bg-muted/50 border border-border/80 space-y-1 text-[11px]">
            <div class="flex items-center gap-2 {passwordLengthOk ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-muted-foreground'}">
              <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center border {passwordLengthOk ? 'border-green-500 bg-green-500/20' : 'border-muted-foreground/40'}">
                {#if passwordLengthOk}<Check class="w-2.5 h-2.5" />{/if}
              </div>
              <span>At least 8 characters</span>
            </div>
            {#if confirmPassword}
              <div class="flex items-center gap-2 {passwordsMatch ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-500'}">
                <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center border {passwordsMatch ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'}">
                  {#if passwordsMatch}<Check class="w-2.5 h-2.5" />{/if}
                </div>
                <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={authStore.isLoading || !username.trim() || !email.trim() || !passwordLengthOk || !passwordsMatch}
          class="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
        >
          {#if authStore.isLoading}
            <div class="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
            <span>Creating account...</span>
          {:else}
            <UserPlus class="w-4 h-4" />
            <span>Create Free Account</span>
          {/if}
        </button>
      </form>
    </div>

    <!-- Sign In Callout -->
    <div class="text-center text-xs text-muted-foreground">
      <span>Already have a NovWrite account?</span>
      <a
        href="/login"
        class="ml-1 font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
      >
        <span>Sign in</span>
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
