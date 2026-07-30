// Codex Studio — Tauri backend.
//
// Every GUI action is a real `codex` invocation or a real file on disk. Nothing
// about the agent, the sandbox, the config schema or the plugin system is
// reimplemented here: the frontend composes flags, this layer runs them and hands
// back what the CLI actually said.

pub mod catalog;
pub mod cli;
pub mod config;
pub mod editors;
pub mod history;
pub mod wsl;

use serde::Deserialize;
use serde_json::json;
use serde_json::Value as Json;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::Emitter;
use tauri::Manager;

/// Live `codex` child processes, keyed by the run id the GUI generated, so a run
/// started from one tab can be reported against that tab.
#[derive(Default)]
struct Runs(Mutex<HashMap<String, u32>>);

/* ------------------------------------------------------------- identity */

#[tauri::command]
fn codex_version() -> Result<Json, String> {
    let out = cli::run(&["--version"])?;
    let text = out.stdout.trim();
    Ok(json!({
        "version": if text.is_empty() { out.stderr.trim() } else { text },
        "home": cli::codex_home().display().to_string(),
        "bin": cli::codex_bin(),
        "bridge": "tauri",
        "ok": out.ok()
    }))
}

/// One round trip that fills the whole shell on launch. Each section degrades on
/// its own: a missing marketplace must not blank out the MCP list beside it.
#[tauri::command]
fn codex_state(cwd: Option<String>) -> Result<Json, String> {
    fn soft(result: Result<Json, String>) -> (Json, Option<String>) {
        match result {
            Ok(v) => (v, None),
            Err(e) => (json!([]), Some(e)),
        }
    }
    let mut errors = serde_json::Map::new();
    let (mcp, e) = soft(catalog::mcp_list());
    if let Some(e) = e {
        errors.insert("mcp".into(), json!(e));
    }
    let (plugins, e) = soft(catalog::plugin_list());
    if let Some(e) = e {
        errors.insert("plugins".into(), json!(e));
    }
    let (catalog_rows, e) = soft(catalog::plugin_catalog());
    if let Some(e) = e {
        errors.insert("catalog".into(), json!(e));
    }
    let (marketplaces, e) = soft(catalog::marketplace_list());
    if let Some(e) = e {
        errors.insert("marketplaces".into(), json!(e));
    }
    let (hooks, e) = soft(catalog::hook_list());
    if let Some(e) = e {
        errors.insert("hooks".into(), json!(e));
    }
    let (features, e) = soft(catalog::feature_list());
    if let Some(e) = e {
        errors.insert("features".into(), json!(e));
    }
    let version = cli::run(&["--version"])
        .map(|o| o.stdout.trim().to_string())
        .unwrap_or_default();
    Ok(json!({
        "codexHome": cli::codex_home().display().to_string(),
        "version": version,
        "auth": catalog::auth_status(),
        "mcp": mcp,
        "plugins": plugins,
        "catalog": catalog_rows,
        "marketplaces": marketplaces,
        "skills": catalog::skill_list(cwd.as_deref()),
        "hooks": hooks,
        "features": features,
        "sessions": catalog::session_list(300),
        "config": config::read_json().unwrap_or(Json::Null),
        "wslDistros": wsl::distros().unwrap_or_default(),
        "errors": Json::Object(errors)
    }))
}

/* --------------------------------------------------------------- config */

#[tauri::command]
fn codex_read_config() -> Result<Json, String> {
    config::read_json()
}

#[tauri::command]
fn codex_read_config_text() -> Result<Json, String> {
    Ok(json!({ "path": config::config_path().display().to_string(), "text": config::read_text() }))
}

#[derive(Deserialize)]
struct WriteConfigArgs {
    #[serde(alias = "tomlText", alias = "toml")]
    toml_text: String,
}

#[tauri::command]
fn codex_write_config(args: WriteConfigArgs) -> Result<Json, String> {
    config::write_text(&args.toml_text)
}

#[derive(Deserialize)]
struct SetConfigArgs {
    key: String,
    value: Json,
}

#[tauri::command]
fn codex_set_config(args: SetConfigArgs) -> Result<Json, String> {
    config::set_path(&args.key, &args.value)
}

/* ------------------------------------------------------------------ run */

#[derive(Deserialize)]
struct RunArgs {
    /// Full argv after the `codex` binary, already composed by the GUI.
    #[serde(default)]
    args: Vec<String>,
    cwd: Option<String>,
    /// Event name to stream stdout/stderr lines on, e.g. "codex://stdout".
    stream: Option<String>,
    /// Opaque id so the GUI can attribute this run to the tab that started it.
    id: Option<String>,
}

/// Spawn the CLI, stream every line to the window as it arrives, and return the
/// exit code with the full transcript.
#[tauri::command]
fn codex_run(
    app: tauri::AppHandle,
    state: tauri::State<Runs>,
    args: RunArgs,
) -> Result<Json, String> {
    if args.args.is_empty() {
        return Err("no arguments were composed for this run".into());
    }
    let bin = cli::codex_bin();
    let id = args.id.clone().unwrap_or_default();
    let stream_event = args.stream.clone();
    let emitted = app.clone();
    let run_id = id.clone();

    let (code, lines) = cli::stream(&bin, &args.args, args.cwd.as_deref(), move |line| {
        if let Some(ev) = &stream_event {
            let _ = emitted.emit(
                ev,
                json!({ "id": run_id, "level": line.level, "text": line.text }),
            );
        }
    })?;
    state.0.lock().unwrap().remove(&id);
    Ok(json!({
        "code": code,
        "id": id,
        "lines": lines.iter().map(|l| json!({ "level": l.level, "text": l.text })).collect::<Vec<_>>()
    }))
}

/// A one-shot capture used by panels that only need the text, not a live stream.
#[tauri::command]
fn codex_capture(args: RunArgs) -> Result<Json, String> {
    let refs: Vec<&str> = args.args.iter().map(|s| s.as_str()).collect();
    let out = cli::run_in(&refs, args.cwd.as_deref())?;
    Ok(json!({ "code": out.code, "stdout": out.stdout, "stderr": out.stderr }))
}

/* ------------------------------------------------------------- catalogs */

#[tauri::command]
fn codex_doctor() -> Result<Json, String> {
    catalog::doctor()
}

#[tauri::command]
fn codex_mcp_list() -> Result<Json, String> {
    catalog::mcp_list()
}

#[derive(Deserialize)]
struct NameArgs {
    name: String,
}

#[tauri::command]
fn codex_mcp_toggle(args: NameArgs) -> Result<Json, String> {
    catalog::mcp_toggle(&args.name)
}

#[tauri::command]
fn codex_mcp_remove(args: NameArgs) -> Result<Json, String> {
    catalog::mcp_remove(&args.name)
}

#[derive(Deserialize)]
struct McpAddArgs {
    name: String,
    transport: Option<String>,
    command: Option<String>,
    #[serde(default)]
    args: Vec<String>,
    url: Option<String>,
}

#[tauri::command]
fn codex_mcp_add(args: McpAddArgs) -> Result<Json, String> {
    let transport = args.transport.unwrap_or_else(|| "stdio".into());
    let mut argv: Vec<String> = vec!["mcp".into(), "add".into(), args.name.clone()];
    if transport == "stdio" {
        let command = args
            .command
            .filter(|c| !c.is_empty())
            .ok_or("a stdio MCP server needs a command")?;
        argv.push("--".into());
        argv.push(command);
        argv.extend(args.args);
    } else {
        let url = args
            .url
            .filter(|u| !u.is_empty())
            .ok_or("an HTTP MCP server needs a URL")?;
        argv.push("--url".into());
        argv.push(url);
    }
    let refs: Vec<&str> = argv.iter().map(|s| s.as_str()).collect();
    let out = cli::run(&refs)?;
    if !out.ok() {
        return Err(out.stderr.trim().to_string());
    }
    catalog::mcp_list()
}

#[tauri::command]
fn codex_plugin_list() -> Result<Json, String> {
    catalog::plugin_list()
}

#[tauri::command]
fn codex_plugin_catalog() -> Result<Json, String> {
    catalog::plugin_catalog()
}

#[tauri::command]
fn codex_plugin_install(args: NameArgs) -> Result<Json, String> {
    let out = cli::run(&["plugin", "add", &args.name])?;
    if !out.ok() {
        return Err(out.stderr.trim().to_string());
    }
    catalog::plugin_list()
}

#[tauri::command]
fn codex_plugin_uninstall(args: NameArgs) -> Result<Json, String> {
    let out = cli::run(&["plugin", "remove", &args.name])?;
    if !out.ok() {
        return Err(out.stderr.trim().to_string());
    }
    catalog::plugin_list()
}

#[tauri::command]
fn codex_marketplace_list() -> Result<Json, String> {
    catalog::marketplace_list()
}

#[derive(Deserialize)]
struct MarketplaceArgs {
    name: String,
    url: Option<String>,
}

#[tauri::command]
fn codex_marketplace_add(args: MarketplaceArgs) -> Result<Json, String> {
    let url = args.url.unwrap_or_default();
    let out = cli::run(&["plugin", "marketplace", "add", &args.name, &url])?;
    if !out.ok() {
        return Err(out.stderr.trim().to_string());
    }
    catalog::marketplace_list()
}

#[tauri::command]
fn codex_marketplace_remove(args: NameArgs) -> Result<Json, String> {
    let out = cli::run(&["plugin", "marketplace", "remove", &args.name])?;
    if !out.ok() {
        return Err(out.stderr.trim().to_string());
    }
    catalog::marketplace_list()
}

#[tauri::command]
fn codex_skill_list(cwd: Option<String>) -> Json {
    catalog::skill_list(cwd.as_deref())
}

#[derive(Deserialize)]
struct DirArgs {
    dir: String,
}

#[tauri::command]
fn codex_skill_toggle(args: DirArgs, cwd: Option<String>) -> Result<Json, String> {
    catalog::skill_toggle(&args.dir)?;
    Ok(catalog::skill_list(cwd.as_deref()))
}

#[tauri::command]
fn codex_hook_list() -> Result<Json, String> {
    catalog::hook_list()
}

#[derive(Deserialize)]
struct HookArgs {
    event: String,
    #[serde(default)]
    index: usize,
}

#[tauri::command]
fn codex_hook_toggle(args: HookArgs) -> Result<Json, String> {
    catalog::hook_toggle(&args.event, args.index)
}

#[tauri::command]
fn codex_features() -> Result<Json, String> {
    catalog::feature_list()
}

#[derive(Deserialize)]
struct FeatureArgs {
    key: String,
    value: bool,
}

#[tauri::command]
fn codex_set_feature(args: FeatureArgs) -> Result<Json, String> {
    catalog::feature_set(&args.key, args.value)
}

#[tauri::command]
fn codex_session_list() -> Json {
    catalog::session_list(300)
}

#[derive(Deserialize)]
struct SessionActionArgs {
    id: String,
    action: String,
}

#[tauri::command]
fn codex_session_action(args: SessionActionArgs) -> Result<Json, String> {
    catalog::session_action(&args.id, &args.action)
}

/* ------------------------------------------------------------------ auth */

#[tauri::command]
fn codex_login_status() -> Json {
    catalog::auth_status()
}

/// `codex login` opens a browser and blocks on the callback, so it is spawned
/// detached and the GUI polls `codex_login_status` for the result.
#[tauri::command]
fn codex_login(method: Option<String>) -> Result<Json, String> {
    if method.as_deref() == Some("api") {
        return Err(
            "API-key login reads the key from stdin. Run `codex login --with-api-key` in a terminal so the key never passes through the GUI."
                .into(),
        );
    }
    let bin = cli::codex_bin();
    let child = cli::command(&bin)
        .arg("login")
        .spawn()
        .map_err(|e| format!("could not start `{bin} login`: {e}"))?;
    Ok(json!({ "started": true, "pid": child.id() }))
}

#[tauri::command]
fn codex_logout() -> Result<Json, String> {
    let out = cli::run(&["logout"])?;
    Ok(json!({ "ok": out.ok(), "detail": out.stdout.trim(), "auth": catalog::auth_status() }))
}

/* ------------------------------------------------------------------- wsl */

#[tauri::command]
fn codex_wsl_list(state: tauri::State<wsl::Runtimes>) -> Json {
    wsl::list(&state)
}

#[tauri::command]
fn codex_wsl_spawn(state: tauri::State<wsl::Runtimes>, args: wsl::WslArgs) -> Result<Json, String> {
    wsl::spawn(&state, &args)
}

#[tauri::command]
fn codex_wsl_stop(state: tauri::State<wsl::Runtimes>, args: wsl::WslArgs) -> Json {
    wsl::stop(&state, &args.session)
}

#[tauri::command]
fn codex_wsl_kill(state: tauri::State<wsl::Runtimes>, args: wsl::WslArgs) -> Json {
    wsl::kill(&state, &args.session)
}

#[tauri::command]
fn codex_wsl_set(state: tauri::State<wsl::Runtimes>, args: wsl::WslArgs) -> Json {
    let patch = args.patch.clone().unwrap_or(Json::Null);
    wsl::set(&state, &args.session, &patch)
}

#[tauri::command]
fn codex_wsl_exec(state: tauri::State<wsl::Runtimes>, args: wsl::WslArgs) -> Result<Json, String> {
    wsl::exec(&state, &args)
}

/* --------------------------------------------------------------- history */

#[derive(Deserialize)]
struct CommitArgs {
    message: String,
    #[serde(default = "default_kind")]
    kind: String,
    #[serde(default)]
    snapshot: Json,
}

fn default_kind() -> String {
    "change".into()
}

#[tauri::command]
fn codex_history_commit(args: CommitArgs) -> Result<Json, String> {
    history::commit(&args.message, &args.kind, &args.snapshot)
}

#[tauri::command]
fn codex_history_log(limit: Option<usize>) -> Result<Json, String> {
    history::log(limit.unwrap_or(200))
}

#[derive(Deserialize)]
struct IdArgs {
    id: String,
}

#[tauri::command]
fn codex_history_show(args: IdArgs) -> Result<Json, String> {
    history::show(&args.id)
}

#[tauri::command]
fn codex_history_diff(args: IdArgs) -> Result<Json, String> {
    history::diff(&args.id)
}

#[tauri::command]
fn codex_history_prune(keep: Option<usize>) -> Result<Json, String> {
    history::prune(keep.unwrap_or(100))
}

/* --------------------------------------------------------------- editors */

#[tauri::command]
fn codex_editors() -> Json {
    editors::detect()
}

#[derive(Deserialize)]
struct OpenArgs {
    path: String,
    editor: Option<String>,
    exe: Option<String>,
}

#[tauri::command]
fn codex_open_external(args: OpenArgs) -> Result<Json, String> {
    editors::open(&args.path, args.editor.as_deref(), args.exe.as_deref())
}

#[tauri::command]
fn codex_reveal(args: OpenArgs) -> Result<Json, String> {
    editors::reveal(&args.path)
}

/* ------------------------------------------------------------------ misc */

/// Fonts the appearance editor can actually offer. Reading the two Windows font
/// directories is far cheaper than enumerating the registry and covers both
/// machine-wide and per-user installs.
#[tauri::command]
fn codex_fonts() -> Json {
    let mut names: Vec<String> = Vec::new();
    let mut dirs: Vec<std::path::PathBuf> = Vec::new();
    if let Ok(windir) = std::env::var("WINDIR") {
        dirs.push(std::path::PathBuf::from(windir).join("Fonts"));
    }
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        dirs.push(
            std::path::PathBuf::from(local)
                .join("Microsoft")
                .join("Windows")
                .join("Fonts"),
        );
    }
    for dir in dirs {
        let Ok(entries) = std::fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let ext = path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();
            if !matches!(ext.as_str(), "ttf" | "otf" | "ttc") {
                continue;
            }
            if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                names.push(stem.replace('_', " "));
            }
        }
    }
    names.sort_by_key(|n| n.to_lowercase());
    names.dedup();
    json!({ "fonts": names })
}

#[derive(Deserialize)]
struct PathArgs {
    path: String,
}

/// Read a text file the GUI needs. A relative path resolves against the bundled
/// resource directory, so the changelog ships inside the installer rather than
/// being fetched from the network at runtime.
#[tauri::command]
fn codex_read_text(app: tauri::AppHandle, args: PathArgs) -> Result<Json, String> {
    let direct = std::path::PathBuf::from(&args.path);
    let candidate = if direct.is_absolute() {
        direct
    } else {
        app.path()
            .resource_dir()
            .map_err(|e| e.to_string())?
            .join(&args.path)
    };
    let text = std::fs::read_to_string(&candidate)
        .map_err(|e| format!("{}: {e}", candidate.display()))?;
    Ok(json!({ "path": candidate.display().to_string(), "text": text }))
}

/// Build and run the desktop shell. `main.rs` is only a thin launcher so the
/// whole backend stays unit-testable as a library.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .manage(Runs::default())
        .manage(wsl::Runtimes::default())
        .invoke_handler(tauri::generate_handler![
            codex_version,
            codex_state,
            codex_read_config,
            codex_read_config_text,
            codex_write_config,
            codex_set_config,
            codex_run,
            codex_capture,
            codex_doctor,
            codex_mcp_list,
            codex_mcp_toggle,
            codex_mcp_add,
            codex_mcp_remove,
            codex_plugin_list,
            codex_plugin_catalog,
            codex_plugin_install,
            codex_plugin_uninstall,
            codex_marketplace_list,
            codex_marketplace_add,
            codex_marketplace_remove,
            codex_skill_list,
            codex_skill_toggle,
            codex_hook_list,
            codex_hook_toggle,
            codex_features,
            codex_set_feature,
            codex_session_list,
            codex_session_action,
            codex_login,
            codex_login_status,
            codex_logout,
            codex_wsl_list,
            codex_wsl_spawn,
            codex_wsl_stop,
            codex_wsl_kill,
            codex_wsl_set,
            codex_wsl_exec,
            codex_history_commit,
            codex_history_log,
            codex_history_show,
            codex_history_diff,
            codex_history_prune,
            codex_editors,
            codex_open_external,
            codex_reveal,
            codex_fonts,
            codex_read_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running Codex Studio");
}
