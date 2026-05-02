# Blueprint: Fix for Virtualized Path Resolution in `internal/http/files.go`

## Issue Summary
When the application runs in Docker, there are multiple possible physical roots for the workspace (`/app/workspace`, `/app/.goclaw/workspace`, `~/.goclaw/workspace`). 
Currently, `virtualizePath` maps legacy roots to the `ws/` prefix, but `devirtualizePath` statically maps `ws/` back ONLY to `h.workspace` (the primary one, e.g., `/app/workspace`). 
If a file physically resides in `/app/.goclaw/workspace`, it gets virtualized to `ws/...` and signed. When served, `devirtualizePath` resolves it to `/app/workspace/...` where it doesn't exist, leading to a 404 (or 403).

## Proposed Solution

1. **Unify Workspace Roots Discovery**:
   Create a helper method `getWorkspaceRoots()` on `FilesHandler` that returns an exhaustive, deduplicated list of all allowed workspace roots.
   ```go
   func (h *FilesHandler) getWorkspaceRoots() []string {
       var roots []string
       if h.workspace != "" {
           roots = append(roots, filepath.Clean(h.workspace))
       }
       if home, _ := os.UserHomeDir(); home != "" {
           roots = append(roots, filepath.Clean(filepath.Join(home, ".goclaw", "workspace")))
       }
       roots = append(roots, filepath.Clean("/app/workspace"), filepath.Clean("/app/.goclaw/workspace"))
       
       seen := make(map[string]bool)
       var unique []string
       for _, r := range roots {
           if !seen[r] {
               seen[r] = true
               unique = append(unique, r)
           }
       }
       return unique
   }
   ```

2. **Update `virtualizePath`**:
   Iterate over `h.getWorkspaceRoots()` to find the matching prefix and map it to `ws/`.
   ```go
   func (h *FilesHandler) virtualizePath(absPath string) string {
       sep := string(filepath.Separator)
       absPath = filepath.Clean(absPath)
       for _, root := range h.getWorkspaceRoots() {
           if strings.HasPrefix(absPath, root+sep) || absPath == root {
               return "ws" + absPath[len(root):]
           }
       }
       if h.dataDir != "" && (strings.HasPrefix(absPath, h.dataDir+sep) || absPath == h.dataDir) {
           return "data" + absPath[len(h.dataDir):]
       }
       return absPath
   }
   ```

3. **Update `devirtualizePath` with Existential Checks (Determinism)**:
   When resolving `ws/`, try to find the file in the known roots. If it exists in one of them, return that path. Otherwise, fallback to the primary `h.workspace`.
   ```go
   func (h *FilesHandler) devirtualizePath(virtPath string) string {
       if strings.HasPrefix(virtPath, "ws/") || virtPath == "ws" {
           rel := strings.TrimPrefix(virtPath, "ws")
           // Try to find the file in any known workspace root
           for _, root := range h.getWorkspaceRoots() {
               candidate := filepath.Join(root, rel)
               if _, err := os.Stat(candidate); err == nil {
                   return candidate
               }
           }
           // Fallback to primary workspace
           if h.workspace != "" {
               return filepath.Join(h.workspace, rel)
           }
           return filepath.Join("/app/workspace", rel)
       }
       if strings.HasPrefix(virtPath, "data/") || virtPath == "data" {
           return filepath.Join(h.dataDir, strings.TrimPrefix(virtPath, "data"))
       }
       return virtPath
   }
   ```

4. **Update `handleSign` and `handleServe` Security Checks**:
   Replace the hardcoded allowed lists with `h.getWorkspaceRoots()` when checking if paths are within allowed boundaries.
   - In `handleSign`, `allowedRoots` should be initialized with `h.getWorkspaceRoots()`.
   - In `handleServe`, both the `ft=` signed check and unsigned check should iterate over `h.getWorkspaceRoots()` instead of just `h.workspace` and `legacyWs`.
   - In `handleServe` multi-tenant section, validate against `config.TenantWorkspace(root, tid, slug)` for all roots.
   - In `findInWorkspace`, consider whether it should iterate over multiple roots or just use the primary tenant workspace. Currently it uses `h.tenantWorkspace(r)` which only uses `h.workspace`. This should probably iterate over `h.getWorkspaceRoots()` to find the file if it's hallucinated without timestamps.

This guarantees symmetry: any file in an allowed root will be virtualized to `ws/...`, and when served, `devirtualizePath` will find the exact physical root where it resides. If a path doesn't exist yet (e.g., signing a future file), it correctly falls back to the primary workspace root, which will then virtualize back to `ws/...`.
