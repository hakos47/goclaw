package tools

import (
	"path/filepath"
	"strings"

	"github.com/nextlevelbuilder/goclaw/internal/bootstrap"
)

// IsMemoryDir checks if a path refers to the memory directory itself.
// Handles "memory", "./memory", "/workspace/memory" etc.
func IsMemoryDir(path, workspace string) bool {
	clean := filepath.Clean(path)
	if clean == "memory" {
		return true
	}
	if workspace != "" && filepath.IsAbs(clean) {
		expected := filepath.Join(filepath.Clean(workspace), "memory")
		return clean == expected
	}
	return false
}

// IsMemoryPath returns true if the path is safely isolated to memory directories or files.
// This guarantees that agents can ALWAYS manage their persistent state.
// Handles both relative and absolute paths (when workspace is provided).
func IsMemoryPath(path, workspace string) bool {
	clean := filepath.Clean(path)
	base := filepath.Base(clean)

	// Root-level MEMORY.md or memory.md (or other memory variants)
	dir := filepath.Dir(clean)
	if (dir == "." || dir == "/" || dir == "") && (base == bootstrap.MemoryFile || base == bootstrap.MemoryAltFile || base == bootstrap.MemoryJSONFile) {
		return true
	}

	// Anything under memory/ directory (relative)
	pSlash := filepath.ToSlash(clean)
	if strings.HasPrefix(pSlash, "memory/") || strings.Contains(pSlash, "/memory/") || strings.Contains(pSlash, ".gemini/memory/") {
		return true
	}

	// Absolute path at workspace root or under workspace/memory/
	if workspace != "" && filepath.IsAbs(clean) {
		cleanWS := filepath.Clean(workspace)
		if filepath.Dir(clean) == cleanWS && (base == bootstrap.MemoryFile || base == bootstrap.MemoryAltFile || base == bootstrap.MemoryJSONFile) {
			return true
		}
		memDir := filepath.Join(cleanWS, "memory")
		if strings.HasPrefix(clean, memDir+string(filepath.Separator)) {
			return true
		}
	}

	return false
}

// IsDelicatePath identifies core files and configurations that require authority.
func IsDelicatePath(path string) bool {
	p := filepath.ToSlash(path)
	delicatePatterns := []string{
		".env",
		".nix-api",
		"config.json",
		"config.yaml",
		"docker-compose.yml",
		"Dockerfile",
		".git/",
		".goclaw/secrets",
	}
	for _, pattern := range delicatePatterns {
		if strings.HasSuffix(p, pattern) || strings.Contains(p, pattern) {
			return true
		}
	}
	return false
}

// IsDelicateCommand flags shell commands that mutate host state, manage containers, 
// or escalate privileges.
func IsDelicateCommand(command string) bool {
	words := strings.Fields(command)
	if len(words) == 0 {
		return false
	}
	delicateBinaries := map[string]bool{
		"sudo": true, "su": true, "doas": true,
		"docker": true, "docker-compose": true,
		"apt": true, "apt-get": true, "dpkg": true,
		"apk": true, "yum": true, "pacman": true, "dnf": true,
		"systemctl": true, "service": true, "journalctl": true,
		"chmod": true, "chown": true,
		"kill": true, "pkill": true, "killall": true,
		"rm": true,
	}
	
	for _, word := range words {
		// Remove potential path or arguments from the word to check just the binary name
		base := filepath.Base(word)
		if delicateBinaries[base] || delicateBinaries[word] {
			return true
		}
	}
	return false
}
