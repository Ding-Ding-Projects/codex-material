//! Local, git-backed version history for everything Studio owns.
//!
//! The repository lives beside the app's own data (`$CODEX_HOME/studio`) — never
//! as a `.git` inside a user's project — and is never pushed. Restoring writes a
//! *new* commit rather than rewinding, so history is append-only: an undo can be
//! undone, and that undo undone in turn.
//!
//! The snapshot covers every user-managed record, not just documents: profiles,
//! sessions, accounts, MCP servers, plugins, appearance and settings all travel
//! together, because restoring an account without the configuration it ran under
//! is a subtly wrong state.

use crate::cli::codex_home;
use crate::cli::command;
use serde_json::json;
use serde_json::Value as Json;
use std::path::PathBuf;
use std::process::Output;

pub fn repo() -> PathBuf {
    codex_home().join("studio")
}

const SNAPSHOT: &str = "studio-state.json";
const CONFIG_COPY: &str = "codex-config.toml";

fn git(args: &[&str]) -> Result<Output, String> {
    let dir = repo();
    command("git")
        .arg("-C")
        .arg(&dir)
        .args(args)
        .output()
        .map_err(|e| format!("git {}: {e}", args.join(" ")))
}

fn ensure_repo() -> Result<(), String> {
    let dir = repo();
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    if dir.join(".git").exists() {
        return Ok(());
    }
    command("git")
        .arg("-C")
        .arg(&dir)
        .args(["init", "--initial-branch", "main"])
        .output()
        .map_err(|e| format!("could not create the history repository: {e}"))?;
    // A committer identity is required even for a local-only repo; set it on the
    // repo alone so the user's global git config is left untouched.
    let _ = git(&["config", "user.name", "Codex Studio"]);
    let _ = git(&["config", "user.email", "studio@codex.local"]);
    let _ = std::fs::write(
        dir.join(".gitignore"),
        "# Codex Studio history — local only, never pushed.\n*.bak\n",
    );
    Ok(())
}

/// Record a revision. An unchanged state records nothing, so the history panel
/// stays a list of real events rather than a list of saves.
pub fn commit(message: &str, kind: &str, snapshot: &Json) -> Result<Json, String> {
    ensure_repo()?;
    let dir = repo();
    let body = serde_json::to_string_pretty(snapshot).map_err(|e| e.to_string())?;
    std::fs::write(dir.join(SNAPSHOT), &body).map_err(|e| e.to_string())?;
    // Keep the live config.toml alongside the snapshot so a restore can show what
    // the CLI itself was configured with at that revision.
    if let Ok(text) = std::fs::read_to_string(crate::config::config_path()) {
        let _ = std::fs::write(dir.join(CONFIG_COPY), text);
    }
    git(&["add", "-A"])?;
    let staged = git(&["diff", "--cached", "--quiet"])?;
    if staged.status.success() {
        return Ok(json!({ "committed": false, "reason": "nothing changed" }));
    }
    let subject = format!("[{kind}] {message}");
    let out = git(&["commit", "-m", &subject])?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    let id = git(&["rev-parse", "--short", "HEAD"])?;
    Ok(json!({
        "committed": true,
        "id": String::from_utf8_lossy(&id.stdout).trim(),
        "message": message,
        "kind": kind,
        "repo": dir.display().to_string()
    }))
}

pub fn log(limit: usize) -> Result<Json, String> {
    ensure_repo()?;
    let n = limit.to_string();
    let out = git(&["log", "--pretty=format:%h\u{1f}%at\u{1f}%s", "-n", &n])?;
    if !out.status.success() {
        // A repository with no commits yet is an empty history, not an error.
        return Ok(json!({ "commits": [] }));
    }
    let commits: Vec<Json> = String::from_utf8_lossy(&out.stdout)
        .lines()
        .filter_map(|line| {
            let mut parts = line.split('\u{1f}');
            let id = parts.next()?.to_string();
            let at: u64 = parts.next()?.parse().ok()?;
            let subject = parts.next().unwrap_or("").to_string();
            let (kind, message) = match subject.strip_prefix('[').and_then(|s| s.split_once("] ")) {
                Some((k, m)) => (k.to_string(), m.to_string()),
                None => ("change".to_string(), subject.clone()),
            };
            Some(json!({ "id": id, "at": at, "kind": kind, "message": message }))
        })
        .collect();
    Ok(json!({ "commits": commits, "repo": repo().display().to_string() }))
}

/// The snapshot as it stood at `id`. The caller applies it and then commits the
/// result as a fresh revision — this never mutates history.
pub fn show(id: &str) -> Result<Json, String> {
    ensure_repo()?;
    let spec = format!("{id}:{SNAPSHOT}");
    let out = git(&["show", &spec])?;
    if !out.status.success() {
        return Err(format!(
            "revision {id} has no snapshot: {}",
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    serde_json::from_slice::<Json>(&out.stdout)
        .map_err(|e| format!("revision {id} snapshot does not parse: {e}"))
}

/// Unified diff of the snapshot between a revision and its parent, so the history
/// panel can say what actually changed rather than that something did.
pub fn diff(id: &str) -> Result<Json, String> {
    ensure_repo()?;
    let out = git(&["show", "--format=", "--unified=1", id])?;
    Ok(json!({
        "id": id,
        "diff": String::from_utf8_lossy(&out.stdout).to_string()
    }))
}

/// Drop revisions older than `keep`, oldest-first, by rewriting the branch from a
/// grafted root. Retention is explicit user action, never automatic.
pub fn prune(keep: usize) -> Result<Json, String> {
    ensure_repo()?;
    let count = git(&["rev-list", "--count", "HEAD"])?;
    let total: usize = String::from_utf8_lossy(&count.stdout)
        .trim()
        .parse()
        .unwrap_or(0);
    if total <= keep {
        return Ok(json!({ "pruned": 0, "kept": total }));
    }
    let root = format!("HEAD~{keep}");
    let out = git(&["replace", "--graft", &root])?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    let _ = git(&["filter-branch", "--force", "--", "HEAD"]);
    let _ = git(&["replace", "-d", &root]);
    Ok(json!({ "pruned": total - keep, "kept": keep }))
}
