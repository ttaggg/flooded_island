# Current Active Task

## Task
Fix npm Audit Security Vulnerabilities

## Status
Completed ✅ – All npm security vulnerabilities fixed by upgrading to Tailwind v4 and Vite v7 on 2025-11-17.

---

## Previous Task Context – Migrate Shell Scripts to Use UV for Python Dependency Management

## Status
Completed ✅ – All shell scripts now use `uv` as the primary tool for Python virtual environments and dependency installation on 2025-11-17.

## General Idea
Update all shell scripts that use Python to prioritize `uv` (a fast Python package installer and resolver) for creating virtual environments and installing dependencies. The scripts will automatically install `uv` if it's not available, ensuring consistent and faster dependency management across all environments.

## Plan
1. Add automatic `uv` installation function that installs it if not present
2. Update `deploy_dev.sh` to use `uv` for venv creation and dependency installation
3. Update `deploy_prod.sh` build phase to use `uv`
4. Update `deploy_prod.sh` deployment phase to use `uv`
5. Remove all fallback logic to standalone `pip` usage

## Current Progress
- [x] Added `ensure_uv_installed()` function to `deploy_dev.sh` that auto-installs `uv` using the official installer
- [x] Updated `ensure_python_venv()` to use `uv venv` exclusively
- [x] Updated `install_python_dependencies()` to use `uv pip install` exclusively
- [x] Added `ensure_uv_installed()` to `deploy_prod.sh` build phase heredoc
- [x] Updated `prepare_python_project()` in build phase to use `uv`
- [x] Added `ensure_uv_installed_prod()` for deployment phase
- [x] Updated `setup_backend_virtualenv()` to use `uv` exclusively
- [x] Verified no standalone `pip install` or `python3 -m venv` commands remain
- [x] Validated shell script syntax
- [x] Updated documentation

## Implementation Details
- All scripts now check if `uv` is installed and automatically install it via `curl -LsSf https://astral.sh/uv/install.sh | sh`
- After installation, `uv` is added to PATH for the current session
- Virtual environments are created with `uv venv`
- Dependencies are installed with `uv pip install -r requirements.txt`
- No fallback to standard pip/venv - `uv` is now mandatory and will be installed automatically
- Scripts fail with clear error message if `uv` installation fails

## Benefits
- Significantly faster dependency installation (10-100x faster than pip)
- Consistent tooling across development and production environments
- Automatic installation ensures no manual setup required
- Better dependency resolution and caching

## Notes
- The `uv` installer adds the binary to `~/.cargo/bin/` on macOS and `~/.local/bin/` on Linux
- Scripts export PATH to include both locations for cross-platform compatibility
- All changes maintain backwards compatibility with existing workflow
- Tested on both macOS (development) and Linux (production deployment)

---

## Previous Task Context – GameBoard Hook Order Fix

## Task
GameBoard Hook Order Fix

## Status
Completed ✅ – React hook order lint issue resolved on 2025-11-17.

## General Idea
Keep hooks unconditional inside `GameBoard.tsx` by delaying the loading fallback and guarding the resize effect body so React Hook ordering rules stay satisfied regardless of initialization state.

## Notes
- ESLint and npm tooling are currently blocked by macOS `Operation not permitted` errors against `frontend/node_modules/path-key`.
- Grid remains playable even on small screens due to minimum cell size enforcement

---

## Previous Task Context – Deploy Script Conciseness Refactor

## Task
Deploy Script Conciseness Refactor

## Status
Completed – helper abstractions, PID capture fix, and documentation landed on 2025-11-17.

## General Idea
Trim duplication inside `scripts/deploy_dev.sh` and `scripts/deploy_prod.sh` by adding local helper functions (logging, dependency prep, service management) so each script reads as a short sequence of phases instead of repetitive shell blocks.

## Notes
- A shared `scripts/lib/deploy.sh` is still a future option, but keeping helpers inline avoided adding another file for this quick pass.
- The PID bug was subtle: any stdout from functions called via command substitution gets captured, so `start_backend()`/`start_frontend()` must produce zero output; all logging happens in the main script after capturing PIDs.

---

## Previous Task Context – Configuration & Build System Refactoring

## Task
Configuration & Build System Refactoring

## Status
Implementation in Progress – Script tooling (Issues #5-7, #12-13) completed; environment templates pending.

## Description
Fix critical WebSocket connection bug and refactor the build/deployment system to properly separate development and production environments with centralized configuration.

## Implementation Plan
See **`docs/refactoring_plan.md`** for 15 discrete, actionable issues that can be tackled one-by-one.

### Quick Reference: 15 Issues
1. **[CRITICAL]** Fix WebSocket localhost bug - 15 min
2. **[HIGH]** Add backend `/health` endpoint - 20 min  
3. **[HIGH]** Update `.gitignore` for build artifacts - 10 min
4. **[HIGH]** Create environment configuration files - 30 min
5. **[MEDIUM]** Create `build_dev.sh` script - 45 min
6. **[MEDIUM]** Create `build_prod.sh` script - 45 min
7. **[MEDIUM]** Create `deploy_dev.sh` / `stop_dev.sh` scripts - 30 min
8. **[MEDIUM]** Create nginx configuration template - 45 min
9. **[MEDIUM]** Create systemd service template - 30 min
10. **[HIGH]** Update backend configuration loading - 30 min
11. **[HIGH]** Create `deploy_prod.sh` script - 2 hours
12. **[LOW]** Remove old `build.sh` script - 5 min
13. **[LOW]** Remove old `deploy.sh` script - 5 min
14. **[MEDIUM]** Update documentation - 1 hour
15. **[LOW]** Create rollback procedure document - 30 min

**Total Estimated Time**: 10-12 hours

## Key Problems Solved

### Issue 1: WebSocket Localhost Connection Bug ⚠️ CRITICAL
- **Root Cause**: Production builds were shipping `VITE_BACKEND_URL=http://localhost:8000`, forcing browsers to connect back to localhost even when served from the production domain.
- **Impact**: Production deployment is non-functional
- **Solution**: Issue #1 - Added environment templates plus a workflow that copies the desired file to `.env`, and updated `getBackendUrl()` to rely on the configured `VITE_BACKEND_URL`.

### Issue 2: Poor Dev/Prod Separation
- **Problem**: No clear naming convention for environment-specific scripts
- **Solution**: Issues #5-7 - Create `*_dev.sh` and `*_prod.sh` scripts

### Issue 3: Configuration Duplication
- **Problem**: Domain/URLs hardcoded in multiple files
- **Solution**: Issues #4, #8-11 - Environment files + templates

## Benefits After Completion
- ✅ WebSocket connections work correctly in production
- ✅ Clear separation between development and production workflows
- ✅ Single source of truth for all configuration (env files)
- ✅ Domain changes require editing only one file
- ✅ Consistent, predictable script naming
- ✅ Scalable architecture (easy to add staging, etc.)
- ✅ Health check endpoint for monitoring
- ✅ Smoke tests in deployment
- ✅ Documented rollback procedure

## Current Progress
- [x] Problem analysis completed
- [x] Root causes identified  
- [x] Comprehensive brief created (`refactoring_brief.md`)
- [x] Discrete actionable issues created (`refactoring_plan.md`)
- [x] Issue #1 – WebSocket localhost bug resolved (2025-11-09)
- [x] Issue #2 – Backend health check endpoint delivered (2025-11-10)
- [x] Issue #3 – `.gitignore` updated to ignore build artifacts (2025-11-10)
- [ ] Issue #4 – Create environment configuration files (templates still pending)
- [x] Issue #5 – `scripts/build_dev.sh` implemented for local builds (2025-11-10)
- [x] Issue #6 – `scripts/build_prod.sh` implemented for production builds (2025-11-10)
- [x] Issue #7 – `scripts/deploy_dev.sh` / `scripts/stop_dev.sh` replace legacy dev scripts (2025-11-10)
- [x] Issue #11 – `scripts/deploy_prod.sh` created from legacy deploy script (2025-11-10)
- [x] Issue #12 – Removed obsolete `build.sh` (2025-11-10)
- [x] Issue #13 – Removed legacy `deploy.sh` entry point (2025-11-10)
- [x] Production deploy script now provisions a backend virtualenv and the systemd unit launches with that interpreter (2025-11-17)
- [x] Build steps merged into `deploy_dev.sh` / `deploy_prod.sh`, removing the standalone build scripts (2025-11-17)

## Recommended Execution Order
1. **Issue #1** - Fix WebSocket (CRITICAL, blocks production)
2. **Issues #2-4** - Foundation (health check, gitignore, env files)
3. **Issue #10** - Backend config (enables other work)
4. **Issues #5-7** - Build scripts (dev workflow)
5. **Issues #8-9** - Config templates (deployment prep)
6. **Issue #11** - Deploy script (complete deployment system)
7. **Test thoroughly in production**
8. **Issues #12-13** - Cleanup old scripts
9. **Issues #14-15** - Documentation and rollback

## Documentation
- **Refactoring Brief**: `docs/refactoring_brief.md` - Complete problem analysis and solution design
- **Implementation Plan**: `docs/refactoring_plan.md` - 15 discrete issues with acceptance criteria
- **Current Task**: This file - High-level status tracking

## Priority
**CRITICAL** - Production deployment is currently non-functional due to WebSocket bug

## Risk Mitigation
- Start with critical bug fix (low risk, high impact)
- Build incrementally - each issue is independent where possible
- Test after each issue
- Keep old scripts until new ones proven
- Document rollback procedure (Issue #15)
- Run smoke tests before declaring success
