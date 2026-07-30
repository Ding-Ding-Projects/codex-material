//! Everything the GUI lists — MCP servers, plugins, marketplaces, skills, hooks,
//! feature flags, saved sessions, auth and doctor — read from the real CLI and the
//! real `CODEX_HOME`, then normalised into the shapes the frontend renders.

use crate::cli;
use crate::config;
use serde_json::json;
use serde_json::Value as Json;
use std::path::Path;
use std::path::PathBuf;

fn str_of(v: &Json, key: &str) -> String {
    v.get(key).and_then(|x| x.as_str()).unwrap_or("").to_string()
}

/* ------------------------------------------------------------------ MCP */

/// `codex mcp list --json` plus the enabled flag the GUI toggles in config.toml.
pub fn mcp_list() -> Result<Json, String> {
    let raw = cli::run_json(&["mcp", "list", "--json"])?;
    let servers = raw.as_array().cloned().unwrap_or_default();
    let out: Vec<Json> = servers
        .iter()
        .map(|s| {
            let transport = s.get("transport").cloned().unwrap_or(Json::Null);
            let kind = str_of(&transport, "type");
            let enabled = s.get("enabled").and_then(|x| x.as_bool()).unwrap_or(true);
            let auth = str_of(s, "auth_status");
            json!({
                "name": str_of(s, "name"),
                "transport": if kind.is_empty() { "stdio".into() } else { kind },
                "command": transport.get("command").and_then(|x| x.as_str()).unwrap_or(""),
                "args": transport.get("args").cloned().unwrap_or(json!([])),
                "url": transport.get("url").and_then(|x| x.as_str()).unwrap_or(""),
                "cwd": transport.get("cwd").and_then(|x| x.as_str()).unwrap_or(""),
                "enabled": enabled,
                "status": if !enabled { "disabled" }
                          else if s.get("disabled_reason").map(|r| !r.is_null()).unwrap_or(false) { "error" }
                          else { "configured" },
                "disabledReason": s.get("disabled_reason").cloned().unwrap_or(Json::Null),
                "oauth": auth != "unsupported" && !auth.is_empty(),
                "authStatus": auth,
                "startupTimeoutSec": s.get("startup_timeout_sec").cloned().unwrap_or(Json::Null),
                "toolTimeoutSec": s.get("tool_timeout_sec").cloned().unwrap_or(Json::Null)
            })
        })
        .collect();
    Ok(Json::Array(out))
}

/// Enable/disable is a config edit, not a CLI verb — Codex reads
/// `mcp_servers.<name>.enabled` on the next run.
pub fn mcp_toggle(name: &str) -> Result<Json, String> {
    let root = config::read_toml()?;
    let key = format!("mcp_servers.{name}.enabled");
    let current = config::get_path(&root, &key)
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    config::set_path(&key, &Json::Bool(!current))?;
    mcp_list()
}

pub fn mcp_remove(name: &str) -> Result<Json, String> {
    let out = cli::run(&["mcp", "remove", name])?;
    if !out.ok() {
        return Err(out.stderr.trim().to_string());
    }
    mcp_list()
}

/* -------------------------------------------------------------- plugins */

fn plugin_row(p: &Json) -> Json {
    json!({
        "id": str_of(p, "pluginId"),
        "name": str_of(p, "name"),
        "marketplace": str_of(p, "marketplaceName"),
        "version": str_of(p, "version"),
        "installed": p.get("installed").and_then(|x| x.as_bool()).unwrap_or(false),
        "enabled": p.get("enabled").and_then(|x| x.as_bool()).unwrap_or(false),
        "path": p.get("source").and_then(|s| s.get("path")).and_then(|x| x.as_str()).unwrap_or(""),
        "installPolicy": str_of(p, "installPolicy"),
        "authPolicy": str_of(p, "authPolicy"),
        "desc": p.get("description").and_then(|x| x.as_str()).unwrap_or("")
    })
}

pub fn plugin_list() -> Result<Json, String> {
    let raw = cli::run_json(&["plugin", "list", "--json"])?;
    let installed = raw
        .get("installed")
        .and_then(|x| x.as_array())
        .cloned()
        .unwrap_or_default();
    Ok(Json::Array(installed.iter().map(plugin_row).collect()))
}

/// Everything the configured marketplaces offer, installed or not — this is what
/// the Extend ▸ Plugin marketplace browser renders.
pub fn plugin_catalog() -> Result<Json, String> {
    let raw = cli::run_json(&["plugin", "list", "--available", "--json"])?;
    let mut rows: Vec<Json> = Vec::new();
    for key in ["installed", "available"] {
        if let Some(list) = raw.get(key).and_then(|x| x.as_array()) {
            rows.extend(list.iter().map(plugin_row));
        }
    }
    rows.sort_by(|a, b| str_of(a, "id").cmp(&str_of(b, "id")));
    rows.dedup_by(|a, b| str_of(a, "id") == str_of(b, "id"));
    Ok(Json::Array(rows))
}

pub fn marketplace_list() -> Result<Json, String> {
    let raw = cli::run_json(&["plugin", "marketplace", "list", "--json"])?;
    let arr = raw
        .as_array()
        .cloned()
        .or_else(|| raw.get("marketplaces").and_then(|x| x.as_array()).cloned())
        .unwrap_or_default();
    Ok(Json::Array(
        arr.iter()
            .map(|m| {
                json!({
                    "name": str_of(m, "name"),
                    "url": m.get("root").or_else(|| m.get("source")).and_then(|x| x.as_str()).unwrap_or(""),
                    "plugins": m.get("pluginCount").cloned().unwrap_or(Json::Null)
                })
            })
            .collect::<Vec<_>>(),
    ))
}

/* --------------------------------------------------------------- skills */

fn scan_skills(root: &Path, source: &str, out: &mut Vec<Json>) {
    let Ok(entries) = std::fs::read_dir(root) else {
        return;
    };
    for entry in entries.flatten() {
        let dir = entry.path();
        let manifest = dir.join("SKILL.md");
        if !manifest.is_file() {
            continue;
        }
        let name = dir
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default();
        // A skill is off when its directory is renamed with the `.disabled` suffix —
        // the same convention the CLI itself uses when skipping one.
        let enabled = !name.ends_with(".disabled");
        let head = std::fs::read_to_string(&manifest).unwrap_or_default();
        let desc = head
            .lines()
            .find(|l| l.starts_with("description:"))
            .map(|l| l.trim_start_matches("description:").trim().to_string())
            .unwrap_or_default();
        out.push(json!({
            "name": name.trim_end_matches(".disabled"),
            "dir": dir.display().to_string(),
            "path": manifest.display().to_string(),
            "enabled": enabled,
            "source": source,
            "desc": desc
        }));
    }
}

pub fn skill_list(project_cwd: Option<&str>) -> Json {
    let mut out = Vec::new();
    scan_skills(&cli::codex_home().join("skills"), "user", &mut out);
    if let Some(home) = dirs::home_dir() {
        scan_skills(&home.join(".agents").join("skills"), "user", &mut out);
    }
    if let Some(cwd) = project_cwd {
        scan_skills(
            &PathBuf::from(cwd).join(".codex").join("skills"),
            "project",
            &mut out,
        );
    }
    out.sort_by(|a, b| str_of(a, "name").cmp(&str_of(b, "name")));
    Json::Array(out)
}

/// Enabling/disabling a skill renames its directory — the state lives on disk, so
/// it survives regardless of which client wrote it.
pub fn skill_toggle(dir: &str) -> Result<Json, String> {
    let path = PathBuf::from(dir);
    if !path.join("SKILL.md").is_file() {
        return Err(format!("{dir} is not a skill directory"));
    }
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .ok_or("skill directory has no name")?;
    let parent = path.parent().ok_or("skill directory has no parent")?;
    let dest = if let Some(base) = name.strip_suffix(".disabled") {
        parent.join(base)
    } else {
        parent.join(format!("{name}.disabled"))
    };
    std::fs::rename(&path, &dest).map_err(|e| format!("could not toggle {name}: {e}"))?;
    Ok(json!({ "from": dir, "to": dest.display().to_string() }))
}

/* ---------------------------------------------------------------- hooks */

/// Hooks are declared in config.toml under `[hooks.<event>]`. Untrusted hooks are
/// reported but can never be switched on from the GUI.
pub fn hook_list() -> Result<Json, String> {
    let root = config::read_toml()?;
    let mut out = Vec::new();
    if let Some(table) = config::get_path(&root, "hooks").and_then(|v| v.as_table().cloned()) {
        for (event, value) in table {
            let entries: Vec<toml::Value> = match &value {
                toml::Value::Array(a) => a.clone(),
                other => vec![other.clone()],
            };
            for (i, entry) in entries.iter().enumerate() {
                let t = entry.as_table().cloned().unwrap_or_default();
                let get = |k: &str| {
                    t.get(k)
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string()
                };
                let trusted = t.get("trusted").and_then(|v| v.as_bool()).unwrap_or(false);
                out.push(json!({
                    "event": event,
                    "index": i,
                    "name": if get("name").is_empty() { format!("{event}#{i}") } else { get("name") },
                    "command": get("command"),
                    "scope": if get("scope").is_empty() { "user".to_string() } else { get("scope") },
                    "trusted": trusted,
                    "enabled": t.get("enabled").and_then(|v| v.as_bool()).unwrap_or(trusted)
                }));
            }
        }
    }
    Ok(Json::Array(out))
}

pub fn hook_toggle(event: &str, index: usize) -> Result<Json, String> {
    let hooks = hook_list()?;
    let target = hooks
        .as_array()
        .and_then(|a| {
            a.iter().find(|h| {
                str_of(h, "event") == event
                    && h.get("index").and_then(|i| i.as_u64()).unwrap_or(0) == index as u64
            })
        })
        .cloned()
        .ok_or_else(|| format!("no hook {event}#{index}"))?;
    if !target
        .get("trusted")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
    {
        return Err("untrusted hooks never run and cannot be enabled here".into());
    }
    let now = target
        .get("enabled")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let root = config::read_toml()?;
    let is_array = config::get_path(&root, &format!("hooks.{event}"))
        .map(|v| v.is_array())
        .unwrap_or(false);
    let key = if is_array {
        // toml crate cannot address an array element by path; rewrite the array.
        let mut arr = config::get_path(&root, &format!("hooks.{event}"))
            .and_then(|v| v.as_array().cloned())
            .unwrap_or_default();
        if let Some(item) = arr.get_mut(index).and_then(|v| v.as_table_mut()) {
            item.insert("enabled".into(), toml::Value::Boolean(!now));
        }
        let as_json = serde_json::to_value(toml::Value::Array(arr)).map_err(|e| e.to_string())?;
        config::set_path(&format!("hooks.{event}"), &as_json)?;
        return hook_list();
    } else {
        format!("hooks.{event}.enabled")
    };
    config::set_path(&key, &Json::Bool(!now))?;
    hook_list()
}

/* ------------------------------------------------------------- features */

/// `codex features list` prints `key  <stage words>  <bool>` — parse from both
/// ends so a multi-word stage such as "under development" stays intact.
pub fn feature_list() -> Result<Json, String> {
    let out = cli::run(&["features", "list"])?;
    let mut rows = Vec::new();
    for line in out.stdout.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() < 3 {
            continue;
        }
        let state = parts[parts.len() - 1];
        if state != "true" && state != "false" {
            continue;
        }
        rows.push(json!({
            "key": parts[0],
            "stage": parts[1..parts.len() - 1].join(" "),
            "enabled": state == "true"
        }));
    }
    if rows.is_empty() && !out.ok() {
        return Err(out.stderr.trim().to_string());
    }
    Ok(Json::Array(rows))
}

pub fn feature_set(key: &str, value: bool) -> Result<Json, String> {
    let verb = if value { "enable" } else { "disable" };
    let out = cli::run(&["features", verb, key])?;
    if !out.ok() {
        return Err(format!(
            "`codex features {verb} {key}` failed: {}",
            out.stderr.trim()
        ));
    }
    feature_list()
}

/* ------------------------------------------------------------- sessions */

fn read_session_meta(path: &Path) -> Option<Json> {
    let file = std::fs::File::open(path).ok()?;
    let mut reader = std::io::BufReader::new(file);
    let mut first = String::new();
    use std::io::BufRead;
    reader.read_line(&mut first).ok()?;
    let parsed: Json = serde_json::from_str(first.trim()).ok()?;
    if parsed.get("type").and_then(|t| t.as_str()) != Some("session_meta") {
        return None;
    }
    Some(parsed.get("payload").cloned().unwrap_or(Json::Null))
}

fn walk_rollouts(dir: &Path, archived: bool, out: &mut Vec<Json>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            walk_rollouts(&path, archived, out);
            continue;
        }
        if path.extension().and_then(|e| e.to_str()) != Some("jsonl") {
            continue;
        }
        let stem = path
            .file_stem()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_default();
        let meta = read_session_meta(&path).unwrap_or(Json::Null);
        let id = meta
            .get("id")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| stem.rsplit("-rollout-").next().unwrap_or(&stem).to_string());
        let cwd = meta
            .get("cwd")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let updated = std::fs::metadata(&path)
            .and_then(|m| m.modified())
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let name = meta
            .get("name")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .filter(|s| !s.is_empty())
            .or_else(|| {
                Path::new(&cwd)
                    .file_name()
                    .map(|n| n.to_string_lossy().into_owned())
            })
            .unwrap_or_else(|| id.chars().take(8).collect());
        out.push(json!({
            "id": id,
            "name": name,
            "cwd": cwd,
            "path": path.display().to_string(),
            "updatedAt": updated,
            "archived": archived,
            "originator": meta.get("originator").and_then(|v| v.as_str()).unwrap_or(""),
            "cliVersion": meta.get("cli_version").and_then(|v| v.as_str()).unwrap_or(""),
            "interactive": meta.get("originator").and_then(|v| v.as_str()).unwrap_or("") != "codex_exec"
        }));
    }
}

/// Saved sessions, newest first. Reading only the first line of each rollout keeps
/// this fast even with a few hundred multi-megabyte transcripts on disk.
pub fn session_list(limit: usize) -> Json {
    let home = cli::codex_home();
    let mut out = Vec::new();
    walk_rollouts(&home.join("sessions"), false, &mut out);
    walk_rollouts(&home.join("archived_sessions"), true, &mut out);
    out.sort_by(|a, b| {
        b.get("updatedAt")
            .and_then(|v| v.as_u64())
            .unwrap_or(0)
            .cmp(&a.get("updatedAt").and_then(|v| v.as_u64()).unwrap_or(0))
    });
    out.truncate(limit);
    Json::Array(out)
}

pub fn session_action(id: &str, action: &str) -> Result<Json, String> {
    let verb = match action {
        "archive" => "archive",
        "unarchive" => "unarchive",
        "delete" => "delete",
        other => return Err(format!("unknown session action `{other}`")),
    };
    let out = cli::run(&[verb, id])?;
    if !out.ok() {
        return Err(format!(
            "`codex {verb} {id}` failed: {}",
            out.stderr.trim()
        ));
    }
    Ok(session_list(300))
}

/* ----------------------------------------------------------------- auth */

pub fn auth_status() -> Json {
    let out = match cli::run(&["login", "status"]) {
        Ok(o) => o,
        Err(e) => return json!({ "method": "unknown", "account": null, "error": e }),
    };
    let text = format!("{}{}", out.stdout, out.stderr);
    let line = text.trim().lines().next().unwrap_or("").trim().to_string();
    let lower = line.to_lowercase();
    let method = if lower.contains("api key") {
        "api"
    } else if lower.contains("chatgpt") {
        "chatgpt"
    } else if lower.contains("not logged in") || lower.is_empty() {
        "none"
    } else {
        "unknown"
    };
    let auth_file = cli::codex_home().join("auth.json");
    json!({
        "method": method,
        "detail": line,
        "account": text.lines().find_map(|l| l.split_once("account:").map(|(_, v)| v.trim().to_string())),
        "store": if auth_file.exists() { "file" } else { "keyring" },
        "authFile": auth_file.display().to_string(),
        "ok": out.ok()
    })
}

/* --------------------------------------------------------------- doctor */

/// `codex doctor --json` is a flat map of checks; the GUI renders them grouped by
/// category, so regroup here rather than in the view layer.
pub fn doctor() -> Result<Json, String> {
    let raw = cli::run_json(&["doctor", "--json", "--all"])?;
    let checks = raw
        .get("checks")
        .and_then(|c| c.as_object())
        .cloned()
        .unwrap_or_default();
    let mut groups: Vec<(String, Vec<Json>)> = Vec::new();
    let mut keys: Vec<&String> = checks.keys().collect();
    keys.sort();
    for key in keys {
        let check = &checks[key];
        let category = str_of(check, "category");
        let status = str_of(check, "status");
        let detail = {
            let summary = str_of(check, "summary");
            let extra = check
                .get("details")
                .and_then(|d| d.as_object())
                .map(|d| {
                    d.iter()
                        .map(|(k, v)| {
                            format!("{k}: {}", v.as_str().unwrap_or(&v.to_string()).trim())
                        })
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();
            json!({ "summary": summary, "details": extra })
        };
        let row = json!({
            "name": str_of(check, "id"),
            "ok": status == "ok",
            "status": status,
            "detail": detail.get("summary").and_then(|s| s.as_str()).unwrap_or(""),
            "details": detail.get("details").cloned().unwrap_or(json!([])),
            "remediation": check.get("remediation").cloned().unwrap_or(Json::Null)
        });
        match groups.iter_mut().find(|(name, _)| *name == category) {
            Some((_, rows)) => rows.push(row),
            None => groups.push((category, vec![row])),
        }
    }
    Ok(json!({
        "at": raw.get("generatedAt").cloned().unwrap_or(Json::Null),
        "version": raw.get("codexVersion").cloned().unwrap_or(Json::Null),
        "overall": raw.get("overallStatus").cloned().unwrap_or(Json::Null),
        "groups": groups.into_iter().map(|(name, checks)| json!({ "name": name, "checks": checks })).collect::<Vec<_>>()
    }))
}
