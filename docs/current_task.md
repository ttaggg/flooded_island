# Current Active Task

## Task
GameBoard Hook Order Fix

## Status
Completed ✅ – React hook order lint issue resolved on 2025-11-17.

## General Idea
Keep hooks unconditional inside `GameBoard.tsx` by delaying the loading fallback and guarding the resize effect body so React Hook ordering rules stay satisfied regardless of initialization state.

## Plan
1. Relocate the loading fallback until after all hooks execute.
2. Add a guard inside the resize `useEffect` so it bails out when `gridWidth`/`gridHeight` are missing.
3. Re-run `npm run lint` in `frontend/` and capture any blockers for follow-up.

## Current Progress
- [x] Moved the fallback UI so hooks (state + effects) always execute before any return.
- [x] Added a readiness guard inside the resize effect to prevent undefined grid dimensions from being used.
- [x] Attempted `npm run lint` (frontend); blocked by macOS `Operation not permitted` errors while accessing `node_modules/path-key`.
- [x] Updated `docs/progress.md` and this file.

## Implementation Details
- Hook order is deterministic even when the grid is still initializing.
- The resize effect no longer calculates or attaches listeners until `gridWidth` and `gridHeight` exist.
- The "Initializing game board…" UI is unchanged; it simply renders after hook setup completes.

## Notes
- ESLint and npm tooling are currently blocked by macOS `Operation not permitted` errors against `frontend/node_modules/path-key` (and even `/opt/homebrew/.../npm/...`). Lint/tests must be rerun once filesystem permissions are fixed outside this workspace.
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
