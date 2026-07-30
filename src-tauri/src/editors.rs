//! External editor integration: find what is installed, let the user pick one,
//! and open a project folder or a single file in it.
//!
//! Detection is by executable, not by guessing — an editor that is not actually
//! on this machine is never offered.

use crate::cli::command;
use serde_json::json;
use serde_json::Value as Json;
use std::path::PathBuf;

struct Candidate {
    id: &'static str,
    label: &'static str,
    /// Executables tried in order; the first that resolves wins.
    exes: &'static [&'static str],
    /// Extra locations to probe when the executable is not on PATH.
    hints: &'static [&'static str],
    /// Argument template — `{path}` is replaced with the target.
    args: &'static [&'static str],
}

const CANDIDATES: &[Candidate] = &[
    Candidate {
        id: "vscode",
        label: "Visual Studio Code",
        exes: &["code.cmd", "code"],
        hints: &[
            r"%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd",
            r"%PROGRAMFILES%\Microsoft VS Code\bin\code.cmd",
        ],
        args: &["{path}"],
    },
    Candidate {
        id: "vscode-insiders",
        label: "VS Code Insiders",
        exes: &["code-insiders.cmd", "code-insiders"],
        hints: &[r"%LOCALAPPDATA%\Programs\Microsoft VS Code Insiders\bin\code-insiders.cmd"],
        args: &["{path}"],
    },
    Candidate {
        id: "cursor",
        label: "Cursor",
        exes: &["cursor.cmd", "cursor"],
        hints: &[r"%LOCALAPPDATA%\Programs\cursor\resources\app\bin\cursor.cmd"],
        args: &["{path}"],
    },
    Candidate {
        id: "windsurf",
        label: "Windsurf",
        exes: &["windsurf.cmd", "windsurf"],
        hints: &[r"%LOCALAPPDATA%\Programs\Windsurf\bin\windsurf.cmd"],
        args: &["{path}"],
    },
    Candidate {
        id: "zed",
        label: "Zed",
        exes: &["zed.exe", "zed"],
        hints: &[r"%LOCALAPPDATA%\Zed\Zed.exe"],
        args: &["{path}"],
    },
    Candidate {
        id: "sublime",
        label: "Sublime Text",
        exes: &["subl.exe", "subl"],
        hints: &[r"%PROGRAMFILES%\Sublime Text\subl.exe"],
        args: &["{path}"],
    },
    Candidate {
        id: "notepadpp",
        label: "Notepad++",
        exes: &["notepad++.exe"],
        hints: &[r"%PROGRAMFILES%\Notepad++\notepad++.exe"],
        args: &["{path}"],
    },
    Candidate {
        id: "idea",
        label: "IntelliJ IDEA",
        exes: &["idea64.exe", "idea"],
        hints: &[],
        args: &["{path}"],
    },
    Candidate {
        id: "notepad",
        label: "Notepad",
        exes: &["notepad.exe"],
        hints: &[],
        args: &["{path}"],
    },
];

fn expand(raw: &str) -> PathBuf {
    let mut out = raw.to_string();
    for var in ["LOCALAPPDATA", "PROGRAMFILES", "APPDATA", "USERPROFILE"] {
        if let Ok(value) = std::env::var(var) {
            out = out.replace(&format!("%{var}%"), &value);
        }
    }
    PathBuf::from(out)
}

/// Resolve an executable through PATH, then through the candidate's hints.
fn resolve(cand: &Candidate) -> Option<String> {
    for exe in cand.exes {
        let probe = command("where").arg(exe).output();
        if let Ok(out) = probe {
            if out.status.success() {
                if let Some(first) = String::from_utf8_lossy(&out.stdout).lines().next() {
                    let path = first.trim();
                    if !path.is_empty() {
                        return Some(path.to_string());
                    }
                }
            }
        }
    }
    for hint in cand.hints {
        let path = expand(hint);
        if path.is_file() {
            return Some(path.display().to_string());
        }
    }
    None
}

pub fn detect() -> Json {
    let found: Vec<Json> = CANDIDATES
        .iter()
        .filter_map(|c| {
            resolve(c)
                .map(|exe| json!({ "id": c.id, "label": c.label, "exe": exe, "args": c.args }))
        })
        .collect();
    json!({ "editors": found })
}

/// Open `path` in the chosen editor. With no editor id, the first detected one is
/// used; when nothing is installed the caller gets a clear message rather than a
/// silent no-op.
pub fn open(path: &str, editor: Option<&str>, custom_exe: Option<&str>) -> Result<Json, String> {
    let target = PathBuf::from(path);
    if !target.exists() {
        return Err(format!("{path} does not exist"));
    }
    let target = target.display().to_string();

    if let Some(exe) = custom_exe.filter(|e| !e.is_empty()) {
        let status = command(exe)
            .arg(&target)
            .spawn()
            .map_err(|e| format!("could not start {exe}: {e}"))?;
        return Ok(json!({ "opened": target, "editor": exe, "pid": status.id() }));
    }

    let chosen = match editor.filter(|e| !e.is_empty()) {
        Some(id) => CANDIDATES
            .iter()
            .find(|c| c.id == id)
            .ok_or_else(|| format!("unknown editor `{id}`"))?,
        None => CANDIDATES
            .iter()
            .find(|c| resolve(c).is_some())
            .ok_or("no supported editor was found on this machine")?,
    };
    let exe = resolve(chosen).ok_or_else(|| {
        format!(
            "{} is configured but was not found on this machine",
            chosen.label
        )
    })?;
    let args: Vec<String> = chosen
        .args
        .iter()
        .map(|a| a.replace("{path}", &target))
        .collect();
    let child = command(&exe)
        .args(&args)
        .spawn()
        .map_err(|e| format!("could not start {}: {e}", chosen.label))?;
    Ok(
        json!({ "opened": target, "editor": chosen.id, "label": chosen.label, "exe": exe, "pid": child.id() }),
    )
}

/// Reveal a path in File Explorer — the fallback when no editor is installed.
pub fn reveal(path: &str) -> Result<Json, String> {
    let target = PathBuf::from(path);
    if !target.exists() {
        return Err(format!("{path} does not exist"));
    }
    command("explorer.exe")
        .arg(target.display().to_string())
        .spawn()
        .map_err(|e| format!("could not open File Explorer: {e}"))?;
    Ok(json!({ "revealed": target.display().to_string() }))
}
