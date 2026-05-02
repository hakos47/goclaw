package skills

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// osAgnosticSystemAction attempts to run apk via pkg-helper.
// If not in a container / pkg-helper is missing, falls back to native OS package managers.
func osAgnosticSystemAction(ctx context.Context, action, pkg string) (bool, string) {
	// 1. Try pkg-helper socket (Docker Alpine fast-path)
	if fi, err := os.Stat(pkgHelperSocket); err == nil && fi.Mode().Type()&os.ModeSocket != 0 {
		// Try to see if it's actually alive
		if _, dialErr := net.Dial("unix", pkgHelperSocket); dialErr == nil {
			return apkViaHelper(ctx, action, pkg)
		} else {
			slog.Warn("skills: pkg-helper socket exists but is dead", "error", dialErr)
		}
	}

	slog.Info("skills: pkg-helper not found, falling back to OS-agnostic package manager", "action", action, "pkg", pkg)

	// 2. We are running natively (no pkg-helper). Determine OS package manager.
	// For Nix (Phase 2 preview):
	if _, err := exec.LookPath("nix"); err == nil {
		var cmd *exec.Cmd
		if action == "install" {
			cmd = exec.CommandContext(ctx, "nix", "profile", "install", "nixpkgs#"+pkg)
		} else {
			cmd = exec.CommandContext(ctx, "nix", "profile", "remove", pkg)
		}
		out, err := cmd.CombinedOutput()
		if err != nil {
			return false, fmt.Sprintf("nix %s failed: %v\n%s", action, err, string(out))
		}
		updateNativePersistFile(action, pkg)
		return true, ""
	}

	// 3. Fallback to apt-get
	if _, err := exec.LookPath("apt-get"); err == nil {
		var cmd *exec.Cmd
		if action == "install" {
			cmd = exec.CommandContext(ctx, "sudo", "-n", "apt-get", "install", "-y", pkg)
		} else {
			cmd = exec.CommandContext(ctx, "sudo", "-n", "apt-get", "remove", "-y", pkg)
		}
		out, err := cmd.CombinedOutput()
		if err != nil {
			errStr := string(out)
			if strings.Contains(errStr, "a password is required") {
				return false, "Native install requires root privileges. Please configure passwordless sudo, or use Docker/Nix."
			}
			return false, fmt.Sprintf("apt-get %s failed: %v\n%s", action, err, errStr)
		}
		updateNativePersistFile(action, pkg)
		return true, ""
	}

	// 4. Fallback to brew
	if _, err := exec.LookPath("brew"); err == nil {
		var cmd *exec.Cmd
		if action == "install" {
			cmd = exec.CommandContext(ctx, "brew", "install", pkg)
		} else {
			cmd = exec.CommandContext(ctx, "brew", "uninstall", pkg)
		}
		out, err := cmd.CombinedOutput()
		if err != nil {
			return false, fmt.Sprintf("brew %s failed: %v\n%s", action, err, string(out))
		}
		updateNativePersistFile(action, pkg)
		return true, ""
	}

	return false, "No supported OS package manager found (nix, apt-get, brew) or sudo requires password"
}

func updateNativePersistFile(action, pkg string) {
	runtimeDir := os.Getenv("RUNTIME_DIR")
	if runtimeDir == "" {
		if _, err := os.Stat("/app"); err == nil {
			runtimeDir = "/app/data/.runtime"
		} else {
			home, _ := os.UserHomeDir()
			runtimeDir = filepath.Join(home, ".goclaw", "data", ".runtime")
		}
	}
	listFile := filepath.Join(runtimeDir, "apk-packages") // Reusing the same name for compatibility

	os.MkdirAll(runtimeDir, 0755)

	if action == "install" {
		f, _ := os.OpenFile(listFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if f != nil {
			f.WriteString(pkg + "\n")
			f.Close()
		}
	} else {
		b, _ := os.ReadFile(listFile)
		lines := strings.Split(string(b), "\n")
		var out []string
		for _, l := range lines {
			if l != pkg && l != "" {
				out = append(out, l)
			}
		}
		os.WriteFile(listFile, []byte(strings.Join(out, "\n")+"\n"), 0644)
	}
}
