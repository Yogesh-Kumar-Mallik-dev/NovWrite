# Security Policy & Vulnerability Disclosure

NovWrite takes application security, author privacy, and manuscript integrity very seriously. This document outlines our security architecture, supported versions, vulnerability reporting process, and disclosure policies.

---

## 1. Supported Versions

Security updates are actively applied to the following release tracks:

| Version Track      | Supported  | Security Patch Status                     |
| :----------------- | :--------- | :---------------------------------------- |
| **v2.x (Current)** | ✅ Yes     | Full security patches & active monitoring |
| **v1.x (Legacy)**  | ⚠️ Limited | Critical CVE fixes only                   |
| **< v1.0**         | ❌ No      | Deprecated                                |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or sensitive flaw in NovWrite, please report it privately. **Do not create public GitHub issues for security vulnerabilities.**

### 2.1. Responsible Disclosure Contact

- **Security Team Email:** `security@novwrite.dev`
- **PGP Key Fingerprint (Optional):** Available upon request from `security@novwrite.dev`

### 2.2. What to Include in Your Report

To help us triage and resolve the issue quickly, include:

1. **Description:** Clear summary of the vulnerability (e.g. Broken Object Level Authorization, Rate Limiter Bypass, JWT Claim Tampering, Cross-Tenant Leaks).
2. **Steps to Reproduce:** Exact reproduction steps, curl commands, or script payloads.
3. **Affected Components:** Specific files, routes, packages, or versions affected.
4. **Impact Assessment:** Severity, potential blast radius, and whether user data is exposed.
5. **Mitigation / Remediation:** Any suggested patch or defense strategy.

---

## 3. Vulnerability Response SLA & Process

1. **Acknowledgment:** Within **24 hours** of receipt.
2. **Initial Assessment & Triage:** Within **48 hours** with severity rating (CVSS v3.1).
3. **Patch Development & Testing:** Priority fix developed in a private security fork.
4. **Release & Coordinated Disclosure:** Security advisory published on GitHub alongside patched release tags.

---

## 4. Built-in Security & Defense-in-Depth Architecture

NovWrite implements several built-in defensive layers:

1. **In-Memory Token Bucket Rate Limiting (`RateLimiterMiddleware`):**
   - Per-IP rate limiting (default 300 requests/minute).
   - Dynamic `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset-Seconds` response headers.
   - RFC 7807 `429 Too Many Requests` responses with retry telemetry.
2. **Request Body Size Limiting (`MaxBytesMiddleware`):**
   - Strict 10MB payload size limit (`http.MaxBytesReader`) on all inbound HTTP requests to prevent payload exhaustion DoS.
3. **Hardened HTTP Security Headers:**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - Strict Content Security Policy (CSP).
4. **Cryptographic Multi-Tier Role RBAC:**
   - Explicit 3-tier system hierarchy (`USER`, `ADMIN`, `SUPER_ADMIN`).
   - Strict **Singleton Super Admin Constraint** (`novwrite_ops` / `sysadmin@novwrite.dev`).
   - Server-side Go CLI tool (`apps/api/cmd/admin-cli`) for out-of-band host administration.
   - Role-gated Go middlewares (`RequireAdmin`, `RequireSuperAdmin`).
5. **Zero-Trust Backend Validation Parity:**
   - Server-side normalization of machine keys to lowercase (`strings.ToLower`).
   - Rejection of duplicate field keys within schemas.
   - Server-side AST validation and deterministic formula calculation preventing client-side value spoofing.
