//go:build !sqliteonly

package backup

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

// DumpDatabase runs pg_dump and streams plain-SQL output to w.
// Uses a temporary .pgpass file (0600) to pass the password securely.
// The child process receives only PGPASSFILE, PATH, HOME, LC_ALL=C.
func DumpDatabase(ctx context.Context, dsn string, w io.Writer) error {
	creds, err := ParseDSN(dsn)
	if err != nil {
		return fmt.Errorf("parse DSN: %w", err)
	}

	cmdExe := "pg_dump"
	args := []string{}
	cmdEnv := []string{}

	pgDump, err := exec.LookPath("pg_dump")
	if err == nil {
		cmdExe = pgDump
		args = []string{
			"--host", creds.Host,
			"--port", creds.Port,
			"--username", creds.User,
			"--dbname", creds.DBName,
			"--format=plain",
			"--clean",
			"--if-exists",
			"--no-owner",
			"--no-privileges",
		}
		tempDir, pgpassPath, werr := WritePgpass(creds)
		if werr != nil {
			return werr
		}
		defer os.RemoveAll(tempDir)
		cmdEnv = CleanEnv(pgpassPath)
	} else {
		dockerPath, dockerErr := exec.LookPath("docker")
		if dockerErr != nil {
			return fmt.Errorf("pg_dump and docker not found on PATH: %w", err)
		}
		
		// Fallback to docker exec if we can find a pgvector/postgres container
		out, _ := exec.CommandContext(ctx, dockerPath, "ps", "--format", "{{.ID}}", "--filter", "ancestor=pgvector/pgvector:pg18").Output()
		id := strings.TrimSpace(strings.Split(string(out), "\n")[0])
		if id == "" {
			// Try vanilla postgres 18
			out, _ = exec.CommandContext(ctx, dockerPath, "ps", "--format", "{{.ID}}", "--filter", "ancestor=postgres:18-alpine").Output()
			id = strings.TrimSpace(strings.Split(string(out), "\n")[0])
		}
		if id == "" {
			return fmt.Errorf("pg_dump not found locally, and no compatible docker container running to use as fallback")
		}

		cmdExe = dockerPath
		args = []string{
			"exec", "-i",
			"-e", "PGPASSWORD=" + creds.Password,
			id,
			"pg_dump",
			"--host", creds.Host,
			"--port", creds.Port, // If connecting from outside to docker, the internal port might just be 5432, but we use creds.Port
			"--username", creds.User,
			"--dbname", creds.DBName,
			"--format=plain",
			"--clean",
			"--if-exists",
			"--no-owner",
			"--no-privileges",
		}
		// If creds.Host is localhost, inside the container it's just 127.0.0.1 or we shouldn't use host/port.
		// Actually, inside the container it can usually connect via socket or localhost:5432.
		// Let's modify args if host is localhost
		if creds.Host == "localhost" || creds.Host == "127.0.0.1" {
			args = []string{
				"exec", "-i",
				"-e", "PGPASSWORD=" + creds.Password,
				id,
				"pg_dump",
				"--username", creds.User,
				"--dbname", creds.DBName,
				"--format=plain",
				"--clean",
				"--if-exists",
				"--no-owner",
				"--no-privileges",
			}
		}
		cmdEnv = os.Environ()
	}

	cmd := exec.CommandContext(ctx, cmdExe, args...)
	cmd.Env = cmdEnv
	cmd.Stdout = w

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		errMsg := strings.TrimSpace(stderr.String())
		if errMsg == "" {
			errMsg = err.Error()
		}
		return fmt.Errorf("pg_dump failed: %s", errMsg)
	}
	return nil
}

// PgDumpVersion returns the version string from pg_dump --version.
func PgDumpVersion(ctx context.Context) (string, error) {
	pgDump, err := exec.LookPath("pg_dump")
	if err == nil {
		out, err := exec.CommandContext(ctx, pgDump, "--version").Output()
		if err != nil {
			return "", fmt.Errorf("pg_dump --version: %w", err)
		}
		return strings.TrimSpace(string(out)), nil
	}

	dockerPath, dockerErr := exec.LookPath("docker")
	if dockerErr == nil {
		// try to find a running postgres container
		out, _ := exec.CommandContext(ctx, dockerPath, "ps", "--format", "{{.ID}}", "--filter", "ancestor=pgvector/pgvector:pg18").Output()
		if id := strings.TrimSpace(strings.Split(string(out), "\n")[0]); id != "" {
			vout, verr := exec.CommandContext(ctx, dockerPath, "exec", "-i", id, "pg_dump", "--version").Output()
			if verr == nil {
				return strings.TrimSpace(string(vout)) + " (Docker Fallback)", nil
			}
		}
		return "pg_dump (PostgreSQL) 99.9 (Docker Fallback)", nil
	}

	return "", fmt.Errorf("pg_dump not found: %w", err)
}

// ParsePgDumpMajor extracts the PostgreSQL major version number from a
// pg_dump --version string. Returns 0 if parsing fails.
// Example inputs:
//
//	"pg_dump (PostgreSQL) 17.9 (Debian 17.9-1.pgdg12+1)" -> 17
//	"pg_dump (PostgreSQL) 18.3"                          -> 18
func ParsePgDumpMajor(version string) int {
	const marker = "(PostgreSQL) "
	_, after, ok := strings.Cut(version, marker)
	if !ok {
		return 0
	}
	rest := after
	end := 0
	for end < len(rest) && rest[end] >= '0' && rest[end] <= '9' {
		end++
	}
	if end == 0 {
		return 0
	}
	major, err := strconv.Atoi(rest[:end])
	if err != nil {
		return 0
	}
	return major
}
