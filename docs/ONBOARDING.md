# NovWrite Developer Onboarding Guide

Welcome to the **NovWrite** engineering codebase. This guide outlines workstation prerequisites, cross-platform dependency installation commands (Windows, macOS, Linux), local infrastructure setup, monorepo lifecycle workflows, and developer conventions.

---

## 1. System Prerequisites

The NovWrite monorepo requires the following toolchains and runtimes:

- **Go (1.23+)**: Application API backend (`apps/api`).
- **Node.js (22+ LTS) & pnpm (9+ / 10+)**: SvelteKit web frontend (`apps/web`), TypeScript data service (`apps/data-service`), and shared contracts (`packages/bridge`).
- **Docker & Docker Compose (v2)**: Local PostgreSQL 18 with `pgvector`, Redis 7.2+, and Traefik reverse proxy.
- **Protocol Buffers Compiler (`protoc`) & Go gRPC Plugins**: gRPC inter-service contracts (`proto/data/v1/`).
- **Buf CLI (`buf`)**: High-performance Protobuf linter, formatter, and code generator.
- **Git (with GPG signing support)**: Source control and signed commit verification.
- **C/C++ Build Essentials / Make**: Native module compilation and local build helpers.

---

## 2. Cross-Platform Dependency Installation

Select your operating system below for complete copy-pasteable installation commands.

### 2.1. Linux (Ubuntu / Debian / Linux Mint)

```bash
# Update package repositories
sudo apt-get update && sudo apt-get install -y \
  curl wget git build-essential make ca-certificates gnupg protobuf-compiler

# 1. Install Go 1.23+
GO_VERSION="1.23.6"
wget "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf /tmp/go.tar.gz
rm /tmp/go.tar.gz

# Add Go to PATH (append to ~/.bashrc or ~/.zshrc)
echo 'export PATH=$PATH:/usr/local/go:$HOME/go/bin' >> ~/.bashrc
export PATH=$PATH:/usr/local/go:$HOME/go/bin

# 2. Install Node.js 22 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Enable and Install pnpm
corepack enable
corepack prepare pnpm@latest --activate
# Or alternatively via standalone script:
# curl -fsSL https://get.pnpm.io/install.sh | sh -

# 4. Install Docker Engine & Docker Compose
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker without sudo (optional but recommended)
sudo usermod -aG docker $USER
newgrp docker

# 5. Install Protobuf Go Plugins & Buf CLI
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
BIN="/usr/local/bin" && \
curl -sSL \
  "https://github.com/bufbuild/buf/releases/latest/download/buf-$(uname -s)-$(uname -m)" \
  -o "${BIN}/buf" && \
chmod +x "${BIN}/buf"
```

### 2.2. Linux (Fedora / RHEL / CentOS Stream)

```bash
# Update package repositories and base tools
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y curl wget git make protobuf-compiler

# 1. Install Go 1.23+
sudo dnf install -y golang

# 2. Install Node.js 22 LTS
sudo dnf module enable -y nodejs:22
sudo dnf install -y nodejs

# 3. Enable pnpm
corepack enable
corepack prepare pnpm@latest --activate

# 4. Install Docker CE
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# 5. Install Protobuf Go Plugins & Buf CLI
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
BIN="/usr/local/bin" && \
curl -sSL \
  "https://github.com/bufbuild/buf/releases/latest/download/buf-$(uname -s)-$(uname -m)" \
  -o "${BIN}/buf" && \
chmod +x "${BIN}/buf"
```

### 2.3. Linux (Arch Linux / Manjaro)

```bash
# Update and install dependencies via pacman
sudo pacman -Syu --noconfirm \
  base-devel git curl wget make \
  go \
  nodejs-lts-iron npm \
  protobuf \
  docker docker-compose

# Enable and start Docker service
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Enable pnpm
sudo npm install -g corepack
corepack enable
corepack prepare pnpm@latest --activate

# Install Go Protobuf Plugins & Buf
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
sudo pacman -S --noconfirm buf
```

### 2.4. macOS (Homebrew)

Ensure [Homebrew](https://brew.sh) is installed on your Mac:

```bash
# 1. Install core tools, runtimes, and compilers
brew install \
  go \
  node@22 \
  pnpm \
  protobuf \
  bufbuild/buf/buf \
  protoc-gen-go \
  protoc-gen-go-grpc \
  git \
  make

# Link Node 22 if not default
brew link --overwrite node@22

# 2. Install Docker Desktop (or OrbStack / Colima)
brew install --cask docker

# 3. Add Go binaries to shell PATH (~/.zshrc)
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.zshrc
source ~/.zshrc
```

### 2.5. Windows (Native & Winget / Chocolatey / Scoop)

We recommend using **Windows Package Manager (`winget`)** or **WSL2 (Ubuntu)** for the best developer experience.

#### Option A: Native Windows with Winget (PowerShell as Administrator)

```powershell
# 1. Install Git, Go, Node.js LTS, and pnpm
winget install --id Git.Git -e --source winget
winget install --id GoLang.Go -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
winget install --id pnpm.pnpm -e --source winget

# 2. Install Docker Desktop
winget install --id Docker.DockerDesktop -e --source winget

# 3. Install Protocol Buffers compiler (protoc)
winget install --id Google.Protobuf -e --source winget

# 4. Install Buf CLI
winget install --id BufBuild.Buf -e --source winget

# 5. Install Go Protobuf Plugins (Run after restarting terminal)
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

#### Option B: Native Windows with Chocolatey (PowerShell as Administrator)

```powershell
choco install -y git golang nodejs-lts pnpm docker-desktop protoc buf
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

#### Option C: Native Windows with Scoop

```powershell
scoop install git go nodejs-lts pnpm protobuf buf
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

#### Option D: Windows Subsystem for Linux (WSL2 - Recommended for Windows Users)

1. Enable WSL2 in PowerShell: `wsl --install -d Ubuntu`
2. Restart your computer if prompted.
3. Open Ubuntu from your Start Menu and follow the **[Linux (Ubuntu / Debian)](#21-linux-ubuntu--debian--linux-mint)** installation instructions above.

---

## 3. Verify Toolchain Installation

Run this verification block in your terminal to ensure all required binaries are in your `$PATH`:

```bash
echo "=== NovWrite Toolchain Verification ==="
echo "Go:       $(go version 2>&1 || echo 'NOT FOUND')"
echo "Node.js:  $(node -v 2>&1 || echo 'NOT FOUND')"
echo "pnpm:     $(pnpm -v 2>&1 || echo 'NOT FOUND')"
echo "Docker:   $(docker --version 2>&1 || echo 'NOT FOUND')"
echo "Compose:  $(docker compose version 2>&1 || echo 'NOT FOUND')"
echo "Protoc:   $(protoc --version 2>&1 || echo 'NOT FOUND')"
echo "Buf:      $(buf --version 2>&1 || echo 'NOT FOUND')"
echo "Git:      $(git --version 2>&1 || echo 'NOT FOUND')"
echo "========================================"
```

---

## 4. Clone & Setup Workspace

### 4.1. Clone Repository

```bash
git clone https://github.com/Yogesh-Kumar-Mallik-dev/NovWrite.git
cd NovWrite
```

### 4.2. Install Node.js Monorepo Dependencies

```bash
pnpm install
```

### 4.3. Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Review the core environment keys in `.env`:

```ini
# Application Ports & Service Endpoints
PORT=8080
DATA_SERVICE_ADDR=localhost:50051

# Database & Cache Connection Strings
DATABASE_URL="postgresql://novwrite:novwrite_dev@localhost:5432/novwrite_db?sslmode=disable"
REDIS_URL="redis://localhost:6379/0"

# Security & Secrets
JWT_SECRET="novwrite-super-secret-jwt-signing-key-dev-environment-only"

# AI Grounding Gateway (Optional for local testing)
OPENAI_API_KEY=""
```

---

## 5. Local Infrastructure & Database Initialization

### 5.1. Start PostgreSQL & Redis Containers

```bash
docker compose -f deploy/compose.yaml up -d postgres redis
```

### 5.2. Push Prisma Schema & Generate Client

```bash
# Push database tables and extensions to PostgreSQL
pnpm --filter @novwrite/data-service db:push

# Generate typed Prisma client bindings
pnpm --filter @novwrite/data-service db:generate

# Build shared communication bridge contracts
pnpm --filter @novwrite/bridge build
```

---

## 6. Monorepo 1-Click Orchestration Scripts

NovWrite provides dedicated top-level lifecycle scripts with universal cross-platform support across Linux, macOS, and Windows:

### 6.1. Linux, macOS, and Windows (Git Bash / WSL)
```bash
# 🚀 1-Click Development Environment
# (Starts Postgres & Redis containers, verifies health, boots Go API Backend & SvelteKit Web simultaneously)
./dev.sh

# 🏗️ 1-Click Monorepo Production Build
# (Compiles bridge contracts, data-service dist, Go binary, and web bundle)
./build.sh

# 🔍 1-Click Monorepo Typecheck & Diagnostics
# (Runs svelte-check and tsc across all workspace packages with 0 warnings/errors tolerance)
./check.sh

# 🧪 1-Click 5-Phase Monorepo Test Runner
# (Executes bridge tests -> data-service tests -> Go backend tests -> web tests -> typecheck)
./test.sh

# 🧹 Clean Slate Database & Redis Reset Utility
# (Flushes Redis 7.2 keys via FLUSHALL and resets PostgreSQL tables to 0 records)
./flush_db.sh
```

### 6.2. Windows (PowerShell / Windows Terminal / pwsh)
```powershell
# 🚀 1-Click Development Environment
.\dev.ps1

# 🏗️ 1-Click Monorepo Production Build
.\build.ps1

# 🔍 1-Click Monorepo Typecheck & Diagnostics
.\check.ps1

# 🧪 1-Click 5-Phase Monorepo Test Runner
.\test.ps1

# 🧹 Clean Slate Database & Redis Reset Utility
.\flush_db.ps1
```

---

## 7. Granular Manual Service Execution

If you prefer to run services in separate terminal windows:

### Terminal 1: Infrastructure
```bash
docker compose -f deploy/compose.yaml up postgres redis
```

### Terminal 2: TypeScript Data Service
```bash
pnpm --filter @novwrite/data-service dev
```

### Terminal 3: Go API Backend
```bash
cd apps/api && go run ./cmd/server
```

### Terminal 4: SvelteKit Web Frontend
```bash
pnpm --filter @novwrite/web dev
```

Access the applications in your browser:
- **Web Application Workbench:** [http://localhost:5173](http://localhost:5173)
- **Go API Backend Health Probe:** [http://localhost:8080/healthz](http://localhost:8080/healthz)
- **Go API Server Projects Route:** [http://localhost:8080/api/v1/projects](http://localhost:8080/api/v1/projects)
- **Prisma Studio Inspector:** `pnpm --filter @novwrite/data-service db:studio` $\to$ [http://localhost:5555](http://localhost:5555)

---

## 8. Development Workflow & Engineering Rules

All contributors and AI agents must strictly follow the repository standards defined in [`.agent/agents.md`](file:///home/yogesh/Projects/NovWrite/.agent/agents.md):

1. **Strict Single-Change Policy**: Make strictly one atomic change per task (one feature, one refactor, or one fix).
2. **Commit Standard**: Follow `<type>(<domain>): <expression>` (e.g. `feat(universe): add formula parser for combat powers`).
3. **Signed Commits**: Always sign commits using GPG: `git commit -S -m "..."`.
4. **Zero-Badge UI Policy**: Badges, chips, and pill tags are prohibited. Use semantic icons, action buttons, accessible breadcrumbs, and slide-over drawers instead.
5. **Zero Redundant Close Buttons**: Omit redundant `X` buttons on modals/drawers that provide explicit Cancel/Close buttons, Escape keydown dismissal, and backdrop click handlers.
6. **Mobile-First Responsive Layouts**: Fluid containers (`w-full`, auto-fit grids), isolated horizontal scrolling for DAGs/tables, top pagination bars to prevent layout jumps, and viewport-safe modals (`max-h-[min(90dvh,800px)]`).
7. **Motion & Accessibility**: All transitions use Svelte 5 native bidirectional transitions (`transition:fade`, `transition:scale`, `transition:fly`, 150–220ms) and degrade gracefully with `@media (prefers-reduced-motion: reduce)`.
8. **Single-Icon Purple Theme Toggle**: Only one theme icon visible at a time (Sun in dark, Moon in light) rendered with theme purple `#7c3aed`.
9. **Clean Slate Workspace Initialization**: Newly created novel projects always start with empty blueprints and entities. Deleting projects follows a strict 3-step confirmation sequence.
