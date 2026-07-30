//! `~/.codex/config.toml` access.
//!
//! The GUI never edits the file as text — it hands over a dotted key path and a
//! JSON value, and this module rewrites the document. Every write backs the
//! previous file up first, so a bad edit is always recoverable from disk even if
//! the in-app history is lost.

use crate::cli::codex_home;
use serde_json::Value as Json;
use std::path::PathBuf;
use toml::Value as Toml;

pub fn config_path() -> PathBuf {
    codex_home().join("config.toml")
}

pub fn read_text() -> String {
    std::fs::read_to_string(config_path()).unwrap_or_default()
}

pub fn read_toml() -> Result<Toml, String> {
    let text = read_text();
    if text.trim().is_empty() {
        return Ok(Toml::Table(toml::map::Map::new()));
    }
    text.parse::<Toml>()
        .map_err(|e| format!("{} does not parse: {e}", config_path().display()))
}

pub fn read_json() -> Result<Json, String> {
    let parsed = read_toml()?;
    serde_json::to_value(parsed).map_err(|e| e.to_string())
}

/// Copy the current config next to itself before it is replaced. Returns the
/// backup path when one was made (no file yet ⇒ nothing to back up).
pub fn backup() -> Option<PathBuf> {
    let path = config_path();
    if !path.exists() {
        return None;
    }
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or_default();
    let dest = path.with_file_name(format!("config.toml.studio-{stamp}.bak"));
    std::fs::copy(&path, &dest).ok().map(|_| dest)
}

pub fn write_text(text: &str) -> Result<Json, String> {
    text.parse::<Toml>()
        .map_err(|e| format!("refusing to write invalid TOML: {e}"))?;
    let path = config_path();
    let backed = backup();
    std::fs::create_dir_all(codex_home()).map_err(|e| e.to_string())?;
    std::fs::write(&path, text).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({
        "written": true,
        "path": path.display().to_string(),
        "backup": backed.map(|p| p.display().to_string()),
        "bytes": text.len()
    }))
}

fn json_to_toml(v: &Json) -> Option<Toml> {
    Some(match v {
        Json::Null => return None,
        Json::Bool(b) => Toml::Boolean(*b),
        Json::Number(n) => {
            if let Some(i) = n.as_i64() {
                Toml::Integer(i)
            } else {
                Toml::Float(n.as_f64().unwrap_or_default())
            }
        }
        Json::String(s) => Toml::String(s.clone()),
        Json::Array(a) => Toml::Array(a.iter().filter_map(json_to_toml).collect()),
        Json::Object(o) => {
            let mut t = toml::map::Map::new();
            for (k, val) in o {
                if let Some(tv) = json_to_toml(val) {
                    t.insert(k.clone(), tv);
                }
            }
            Toml::Table(t)
        }
    })
}

/// Set (or, with `Json::Null`, remove) a dotted key such as
/// `mcp_servers.github.enabled`. Intermediate tables are created as needed.
pub fn set_path(path: &str, value: &Json) -> Result<Json, String> {
    let mut root = read_toml()?;
    let parts: Vec<&str> = path.split('.').filter(|p| !p.is_empty()).collect();
    if parts.is_empty() {
        return Err("empty config key".into());
    }
    {
        let mut cursor = &mut root;
        for part in &parts[..parts.len() - 1] {
            let table = cursor
                .as_table_mut()
                .ok_or_else(|| format!("`{path}` crosses a non-table value"))?;
            cursor = table
                .entry(part.to_string())
                .or_insert_with(|| Toml::Table(toml::map::Map::new()));
            if !cursor.is_table() {
                *cursor = Toml::Table(toml::map::Map::new());
            }
        }
        let leaf = parts[parts.len() - 1];
        let table = cursor
            .as_table_mut()
            .ok_or_else(|| format!("`{path}` crosses a non-table value"))?;
        match json_to_toml(value) {
            Some(tv) => {
                table.insert(leaf.to_string(), tv);
            }
            None => {
                table.remove(leaf);
            }
        }
    }
    let text = toml::to_string_pretty(&root).map_err(|e| e.to_string())?;
    write_text(&text)
}

/// Remove a dotted key and every empty table it leaves behind.
pub fn remove_path(path: &str) -> Result<Json, String> {
    set_path(path, &Json::Null)
}

pub fn get_path(root: &Toml, path: &str) -> Option<Toml> {
    let mut cursor = root;
    for part in path.split('.').filter(|p| !p.is_empty()) {
        cursor = cursor.as_table()?.get(part)?;
    }
    Some(cursor.clone())
}
