//! Integration tests for the `codex_studio` library.
//!
//! Every test here is deterministic and offline: none of them invokes the real
//! `codex` binary, touches the network, or reads the user's real `~/.codex`.
//! Anything that needs a CODEX_HOME builds a throwaway one under the system temp
//! directory and points the environment variable at that instead, so a machine
//! with no Codex CLI installed still runs the whole suite green.

use codex_studio::catalog;
use codex_studio::cli;
use codex_studio::config;
use codex_studio::editors;
use codex_studio::history;
use codex_studio::wsl;
use serde_json::json;
use serde_json::Value as Json;
use std::path::Path;
use std::path::PathBuf;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::OnceLock;

/// A name no real program can answer to, so a test that accidentally reaches the
/// CLI fails loudly instead of running whatever `codex` happens to be installed.
const MISSING_BIN: &str = "codex-studio-test-no-such-binary";

/* ------------------------------------------------------------ environment */

/// `CODEX_HOME` and `CODEX_BIN` are process-wide, and the test harness runs tests
/// on several threads at once — without this, one test's temporary home would
/// silently become another's. Every test that touches the environment holds this
/// lock for its entire body; the purely computational tests still run in parallel.
fn env_lock() -> MutexGuard<'static, ()> {
    static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    LOCK.get_or_init(|| Mutex::new(()))
        .lock()
        // A panicking test poisons the mutex. Recovering keeps one failure from
        // cascading into "every other test also failed", which hides the cause.
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn restore(key: &str, previous: &Option<String>) {
    match previous {
        Some(value) => std::env::set_var(key, value),
        None => std::env::remove_var(key),
    }
}

/// A throwaway `CODEX_HOME`, owned for the lifetime of one test.
struct TempHome {
    path: PathBuf,
    previous: Vec<(&'static str, Option<String>)>,
    /// Declared last so the environment is restored and the directory removed
    /// before the next waiting test is allowed to start.
    _lock: MutexGuard<'static, ()>,
}

impl TempHome {
    fn new(tag: &str) -> TempHome {
        let lock = env_lock();
        static SEQ: AtomicUsize = AtomicUsize::new(0);
        let path = std::env::temp_dir().join(format!(
            "codex-studio-test-{tag}-{}-{}",
            std::process::id(),
            SEQ.fetch_add(1, Ordering::SeqCst)
        ));
        let _ = std::fs::remove_dir_all(&path);
        std::fs::create_dir_all(&path).expect("could not create the temporary CODEX_HOME");

        let keys = [
            "CODEX_HOME",
            "CODEX_BIN",
            "GIT_CONFIG_GLOBAL",
            "GIT_CONFIG_SYSTEM",
        ];
        let previous: Vec<(&'static str, Option<String>)> =
            keys.iter().map(|k| (*k, std::env::var(k).ok())).collect();

        std::env::set_var("CODEX_HOME", &path);
        std::env::set_var("CODEX_BIN", MISSING_BIN);
        // Keep the machine's real git config — signing, hooks, templates,
        // init.defaultBranch — out of the throwaway history repository, so the
        // history test behaves identically on every developer's machine.
        std::env::set_var("GIT_CONFIG_GLOBAL", path.join("no-global-gitconfig"));
        std::env::set_var("GIT_CONFIG_SYSTEM", path.join("no-system-gitconfig"));

        TempHome {
            path,
            previous,
            _lock: lock,
        }
    }

    fn join(&self, relative: &str) -> PathBuf {
        self.path.join(relative)
    }

    fn write(&self, relative: &str, body: &str) -> PathBuf {
        let target = self.join(relative);
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent).expect("could not create a test directory");
        }
        std::fs::write(&target, body).expect("could not write a test file");
        target
    }
}

impl Drop for TempHome {
    fn drop(&mut self) {
        for (key, value) in &self.previous {
            restore(key, value);
        }
        let _ = std::fs::remove_dir_all(&self.path);
    }
}

fn git_available() -> bool {
    cli::command("git")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/* ------------------------------------------------------------ cli parsing */

#[test]
fn parse_loose_json_reads_a_clean_document() {
    let object = cli::parse_loose_json(r#"{"name":"github","enabled":true}"#)
        .expect("a clean JSON object must parse");
    assert_eq!(object["name"], json!("github"));
    assert_eq!(object["enabled"], json!(true));

    let array = cli::parse_loose_json(r#"  [{"name":"github"},{"name":"postgres"}]  "#)
        .expect("a clean JSON array must parse, leading whitespace and all");
    assert_eq!(array.as_array().map(|a| a.len()), Some(2));
    assert_eq!(array[1]["name"], json!("postgres"));
}

#[test]
fn parse_loose_json_skips_a_human_banner_before_the_body() {
    let banner_then_array = "Reading configuration from CODEX_HOME\n\
                             checking 2 configured servers\n\
                             [{\"name\":\"github\",\"enabled\":true}]";
    let parsed = cli::parse_loose_json(banner_then_array)
        .expect("JSON behind a banner line must still parse");
    assert_eq!(parsed[0]["name"], json!("github"));

    let banner_then_object = "codex-cli 0.58.0\n{\"checks\":{\"git\":{\"status\":\"ok\"}}}";
    let parsed = cli::parse_loose_json(banner_then_object)
        .expect("an object behind a banner line must still parse");
    assert_eq!(parsed["checks"]["git"]["status"], json!("ok"));
}

#[test]
fn parse_loose_json_returns_none_for_output_that_is_not_json() {
    for text in [
        "",
        "   \n\t  ",
        "codex: command not found",
        "error: not logged in — run `codex login`",
    ] {
        assert!(
            cli::parse_loose_json(text).is_none(),
            "`{text}` is not JSON and must not be reported as parsed"
        );
    }
}

#[test]
fn codex_home_and_bin_follow_the_environment() {
    let home = TempHome::new("env");
    assert_eq!(cli::codex_home(), home.path);
    assert_eq!(cli::codex_bin(), MISSING_BIN);
    assert_eq!(config::config_path(), home.join("config.toml"));

    // A missing binary must surface as a message naming the command that failed,
    // not as a panic — the GUI shows this string verbatim.
    let err = match cli::run(&["--version"]) {
        Err(message) => message,
        Ok(_) => panic!("`{MISSING_BIN}` should not be runnable on any machine"),
    };
    assert!(err.contains(MISSING_BIN), "{err}");
    assert!(err.contains("--version"), "{err}");
}

/* -------------------------------------------------------------- get_path */

const SAMPLE_CONFIG: &str = r#"
model = "gpt-5.1-codex-max"
approval_policy = "on-request"

[tools]
web_search = true

[mcp_servers.github]
command = "gh-mcp"
args = ["serve"]
enabled = false
"#;

fn sample() -> toml::Value {
    SAMPLE_CONFIG
        .parse::<toml::Value>()
        .expect("the fixture must be valid TOML")
}

#[test]
fn get_path_walks_a_dotted_key() {
    let root = sample();
    assert_eq!(
        config::get_path(&root, "model").and_then(|v| v.as_str().map(str::to_string)),
        Some("gpt-5.1-codex-max".to_string())
    );
    assert_eq!(
        config::get_path(&root, "tools.web_search").and_then(|v| v.as_bool()),
        Some(true)
    );
    assert_eq!(
        config::get_path(&root, "mcp_servers.github.command")
            .and_then(|v| v.as_str().map(str::to_string)),
        Some("gh-mcp".to_string())
    );
    assert_eq!(
        config::get_path(&root, "mcp_servers.github.enabled").and_then(|v| v.as_bool()),
        Some(false)
    );
    // An empty path addresses the whole document rather than nothing.
    assert!(config::get_path(&root, "")
        .map(|v| v.is_table())
        .unwrap_or(false));
}

#[test]
fn get_path_returns_none_for_a_missing_key() {
    let root = sample();
    assert!(config::get_path(&root, "nope").is_none());
    assert!(config::get_path(&root, "mcp_servers.gitlab").is_none());
    assert!(config::get_path(&root, "mcp_servers.github.url").is_none());
    assert!(config::get_path(&root, "tools.web_search.deeper").is_none());
}

#[test]
fn get_path_returns_none_when_the_key_crosses_a_non_table() {
    let root = sample();
    // `model` is a string, so nothing can live underneath it.
    assert!(config::get_path(&root, "model.nested").is_none());
    // An array is not a table either — indices are not addressable by path.
    assert!(config::get_path(&root, "mcp_servers.github.args.0").is_none());
}

/* -------------------------------------------------- set_path / remove_path */

#[test]
fn set_path_creates_the_nested_tables_it_needs() {
    let home = TempHome::new("set-nested");
    let written = config::set_path("mcp_servers.github.enabled", &json!(true))
        .expect("setting a nested key must succeed in an empty home");
    assert_eq!(written["written"], json!(true));
    assert_eq!(
        written["path"],
        json!(home.join("config.toml").display().to_string())
    );

    let root = config::read_toml().expect("the file just written must parse");
    assert_eq!(
        config::get_path(&root, "mcp_servers.github.enabled").and_then(|v| v.as_bool()),
        Some(true)
    );

    let text = config::read_text();
    assert!(text.contains("github"), "{text}");
    assert!(text.contains("enabled = true"), "{text}");
}

#[test]
fn set_path_overwrites_a_scalar_without_disturbing_its_neighbours() {
    let _home = TempHome::new("set-overwrite");
    config::set_path("model", &json!("gpt-5.1")).unwrap();
    config::set_path("mcp_servers.github.command", &json!("gh-mcp")).unwrap();
    config::set_path("model", &json!("gpt-5.1-codex-max")).unwrap();

    let root = config::read_toml().unwrap();
    assert_eq!(
        config::get_path(&root, "model").and_then(|v| v.as_str().map(str::to_string)),
        Some("gpt-5.1-codex-max".to_string()),
        "the second write must replace the first, not append beside it"
    );
    assert_eq!(
        config::get_path(&root, "mcp_servers.github.command")
            .and_then(|v| v.as_str().map(str::to_string)),
        Some("gh-mcp".to_string()),
        "rewriting a root scalar must leave an unrelated table intact"
    );
}

#[test]
fn set_path_replaces_a_scalar_that_stands_where_a_table_is_needed() {
    let _home = TempHome::new("set-through-scalar");
    config::set_path("model", &json!("gpt-5.1")).unwrap();
    // `model` is a string; asking for `model.effort` turns it into a table. This
    // pins the real behaviour: the write wins, it does not error out halfway and
    // leave the document in a half-edited state.
    config::set_path("model.effort", &json!("high")).unwrap();

    let root = config::read_toml().unwrap();
    assert!(config::get_path(&root, "model")
        .map(|v| v.is_table())
        .unwrap_or(false));
    assert_eq!(
        config::get_path(&root, "model.effort").and_then(|v| v.as_str().map(str::to_string)),
        Some("high".to_string())
    );
}

#[test]
fn set_path_rejects_an_empty_key() {
    let _home = TempHome::new("set-empty-key");
    let err = config::set_path("", &json!(1)).unwrap_err();
    assert!(err.contains("empty config key"), "{err}");
    assert!(
        !config::config_path().exists(),
        "a rejected key must not create a config file"
    );
}

#[test]
fn remove_path_deletes_the_key_and_leaves_the_rest_alone() {
    let _home = TempHome::new("remove");
    config::set_path("tools.web_search", &json!(true)).unwrap();
    config::set_path("tools.view_image", &json!(false)).unwrap();

    config::remove_path("tools.view_image").unwrap();
    let root = config::read_toml().unwrap();
    assert!(config::get_path(&root, "tools.view_image").is_none());
    assert_eq!(
        config::get_path(&root, "tools.web_search").and_then(|v| v.as_bool()),
        Some(true)
    );

    // Removing the last key of a table still removes the key itself.
    config::remove_path("tools.web_search").unwrap();
    let root = config::read_toml().unwrap();
    assert!(config::get_path(&root, "tools.web_search").is_none());

    // Setting a key to JSON null is the same operation as removing it.
    config::set_path("model", &json!("gpt-5.1")).unwrap();
    config::set_path("model", &Json::Null).unwrap();
    let root = config::read_toml().unwrap();
    assert!(config::get_path(&root, "model").is_none());
}

#[test]
fn write_text_refuses_invalid_toml_and_leaves_the_file_untouched() {
    let home = TempHome::new("invalid-toml");
    config::write_text("model = \"gpt-5.1\"\n").unwrap();
    let before = config::read_text();

    let err = config::write_text("[unclosed\nmodel = ").unwrap_err();
    assert!(err.contains("refusing to write invalid TOML"), "{err}");
    assert_eq!(
        config::read_text(),
        before,
        "a rejected write must not touch the file on disk"
    );

    // The parse happens before the backup, so a rejected write leaves no litter.
    let strays: Vec<String> = std::fs::read_dir(&home.path)
        .unwrap()
        .flatten()
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|n| n.ends_with(".bak"))
        .collect();
    assert!(strays.is_empty(), "unexpected backups: {strays:?}");
}

#[test]
fn write_text_backs_up_the_previous_file_before_replacing_it() {
    let _home = TempHome::new("backup");
    // Nothing to back up the first time.
    let first = config::write_text("model = \"gpt-5.1\"\n").unwrap();
    assert_eq!(first["backup"], Json::Null);

    let second = config::write_text("model = \"gpt-5.1-codex-max\"\n").unwrap();
    let backup = second["backup"]
        .as_str()
        .expect("replacing an existing config must produce a backup path");
    assert_eq!(
        std::fs::read_to_string(backup).unwrap(),
        "model = \"gpt-5.1\"\n",
        "the backup must hold the previous contents, not the new ones"
    );
}

#[test]
fn read_toml_treats_an_absent_config_as_an_empty_document() {
    let _home = TempHome::new("empty-config");
    assert_eq!(config::read_text(), "");
    let root = config::read_toml().expect("a missing config is not an error");
    assert_eq!(root.as_table().map(|t| t.len()), Some(0));
    assert_eq!(config::read_json().unwrap(), json!({}));
}

#[test]
fn read_toml_names_the_file_when_it_does_not_parse() {
    let _home = TempHome::new("corrupt-config");
    std::fs::write(config::config_path(), "[oops\n").unwrap();
    let err = config::read_toml().unwrap_err();
    assert!(err.contains("does not parse"), "{err}");
    assert!(err.contains("config.toml"), "{err}");
}

/* --------------------------------------------------------------- history */

#[test]
fn history_records_real_changes_and_never_rewrites_them() {
    if !git_available() {
        eprintln!(
            "skipping history_records_real_changes_and_never_rewrites_them: `git` is not on PATH"
        );
        return;
    }
    let home = TempHome::new("history");
    assert_eq!(history::repo(), home.join("studio"));

    let first = json!({
        "profiles": [{ "name": "default", "model": "gpt-5.1-codex-max" }],
        "appearance": { "theme": "dark", "seed": "#3366ff" }
    });
    let created = history::commit("Added the default profile", "profile", &first).unwrap();
    assert_eq!(created["committed"], json!(true));
    let first_id = created["id"]
        .as_str()
        .expect("a commit must report its id")
        .to_string();
    assert!(!first_id.is_empty());

    // The same state again is not an event, so it must not become a revision.
    let unchanged = history::commit("Saved again", "profile", &first).unwrap();
    assert_eq!(unchanged["committed"], json!(false));
    assert_eq!(unchanged["reason"], json!("nothing changed"));

    let second = json!({
        "profiles": [{ "name": "default", "model": "gpt-5.1" }],
        "appearance": { "theme": "light", "seed": "#3366ff" }
    });
    let changed = history::commit(
        "Switched the default profile to gpt-5.1",
        "profile",
        &second,
    )
    .unwrap();
    assert_eq!(changed["committed"], json!(true));
    let second_id = changed["id"].as_str().unwrap().to_string();
    assert_ne!(first_id, second_id);

    let log = history::log(50).unwrap();
    let commits = log["commits"]
        .as_array()
        .expect("the log must be an array")
        .clone();
    assert_eq!(
        commits.len(),
        2,
        "the unchanged save must not appear: {commits:?}"
    );
    assert_eq!(commits[0]["id"], json!(second_id));
    assert_eq!(commits[0]["kind"], json!("profile"));
    assert_eq!(
        commits[0]["message"],
        json!("Switched the default profile to gpt-5.1"),
        "the panel must say what changed, so the subject must survive the round trip"
    );
    assert!(commits[0]["at"].as_u64().unwrap_or(0) > 0);
    assert_eq!(commits[1]["message"], json!("Added the default profile"));

    // Append-only: the older revision still reads back byte-for-byte.
    assert_eq!(history::show(&first_id).unwrap(), first);
    assert_eq!(history::show(&second_id).unwrap(), second);

    let diff = history::diff(&second_id).unwrap();
    let text = diff["diff"].as_str().unwrap_or("");
    assert!(text.contains("studio-state.json"), "{text}");
    assert!(text.contains("gpt-5.1-codex-max"), "{text}");

    let missing = history::show("deadbee").unwrap_err();
    assert!(missing.contains("deadbee"), "{missing}");
}

#[test]
fn history_log_is_empty_before_anything_is_committed() {
    if !git_available() {
        eprintln!(
            "skipping history_log_is_empty_before_anything_is_committed: `git` is not on PATH"
        );
        return;
    }
    let _home = TempHome::new("history-empty");
    let log = history::log(10).unwrap();
    assert_eq!(
        log["commits"].as_array().map(|a| a.len()),
        Some(0),
        "a repository with no commits is an empty history, not an error"
    );
}

/* ---------------------------------------------------------- catalog: hooks */

const HOOKS_CONFIG: &str = r#"
[hooks.session-start]
name = "load-context"
command = "bash .codex/hooks/context.sh"
trusted = true

[[hooks.pre-tool-use]]
name = "block-force-push"
command = "python3 block_force_push.py"
trusted = true
enabled = false

[[hooks.pre-tool-use]]
command = "node audit.js"
trusted = false
"#;

fn hook_at<'a>(hooks: &'a Json, event: &str, index: u64) -> &'a Json {
    hooks
        .as_array()
        .expect("hook_list must return an array")
        .iter()
        .find(|h| h["event"] == json!(event) && h["index"].as_u64() == Some(index))
        .unwrap_or_else(|| panic!("no hook {event}#{index} in {hooks}"))
}

#[test]
fn hook_list_reads_both_the_table_and_the_array_form() {
    let home = TempHome::new("hooks-list");
    home.write("config.toml", HOOKS_CONFIG);

    let hooks = catalog::hook_list().unwrap();
    assert_eq!(hooks.as_array().map(|a| a.len()), Some(3), "{hooks}");

    let single = hook_at(&hooks, "session-start", 0);
    assert_eq!(single["name"], json!("load-context"));
    assert_eq!(single["command"], json!("bash .codex/hooks/context.sh"));
    assert_eq!(single["trusted"], json!(true));
    assert_eq!(
        single["enabled"],
        json!(true),
        "with no explicit flag a trusted hook is on"
    );
    assert_eq!(single["scope"], json!("user"), "scope defaults to user");

    let blocked = hook_at(&hooks, "pre-tool-use", 0);
    assert_eq!(blocked["name"], json!("block-force-push"));
    assert_eq!(blocked["enabled"], json!(false), "an explicit flag wins");

    let anonymous = hook_at(&hooks, "pre-tool-use", 1);
    assert_eq!(
        anonymous["name"],
        json!("pre-tool-use#1"),
        "an unnamed hook still needs a stable label in the GUI"
    );
    assert_eq!(anonymous["trusted"], json!(false));
    assert_eq!(
        anonymous["enabled"],
        json!(false),
        "an untrusted hook is off by default"
    );
}

#[test]
fn hook_list_is_empty_when_no_hooks_are_configured() {
    let home = TempHome::new("hooks-none");
    home.write("config.toml", "model = \"gpt-5.1\"\n");
    let hooks = catalog::hook_list().unwrap();
    assert_eq!(hooks.as_array().map(|a| a.len()), Some(0));
}

#[test]
fn hook_toggle_refuses_to_enable_an_untrusted_hook() {
    let home = TempHome::new("hooks-untrusted");
    home.write("config.toml", HOOKS_CONFIG);

    let err = catalog::hook_toggle("pre-tool-use", 1).unwrap_err();
    assert!(err.contains("untrusted"), "{err}");

    let hooks = catalog::hook_list().unwrap();
    assert_eq!(
        hook_at(&hooks, "pre-tool-use", 1)["enabled"],
        json!(false),
        "a refused toggle must not change anything on disk"
    );

    let missing = catalog::hook_toggle("session-end", 0).unwrap_err();
    assert!(missing.contains("session-end"), "{missing}");
}

#[test]
fn hook_toggle_flips_a_trusted_hook_in_both_config_shapes() {
    let home = TempHome::new("hooks-toggle");
    home.write("config.toml", HOOKS_CONFIG);

    // Table form.
    let hooks = catalog::hook_toggle("session-start", 0).unwrap();
    assert_eq!(hook_at(&hooks, "session-start", 0)["enabled"], json!(false));
    let root = config::read_toml().unwrap();
    assert_eq!(
        config::get_path(&root, "hooks.session-start.enabled").and_then(|v| v.as_bool()),
        Some(false)
    );

    // Array-of-tables form: the rewritten array must keep both entries and stay
    // an array, or the second hook would silently vanish from the GUI.
    let hooks = catalog::hook_toggle("pre-tool-use", 0).unwrap();
    assert_eq!(hook_at(&hooks, "pre-tool-use", 0)["enabled"], json!(true));
    assert_eq!(hook_at(&hooks, "pre-tool-use", 1)["trusted"], json!(false));
    assert_eq!(
        hooks.as_array().map(|a| a.len()),
        Some(3),
        "toggling one hook must not drop any other: {hooks}"
    );
    let root = config::read_toml().unwrap();
    assert!(config::get_path(&root, "hooks.pre-tool-use")
        .map(|v| v.is_array())
        .unwrap_or(false));
}

/* --------------------------------------------------------- catalog: skills */

fn rows_under<'a>(list: &'a Json, prefix: &Path) -> Vec<&'a Json> {
    let prefix = prefix.display().to_string();
    list.as_array()
        .map(|a| {
            a.iter()
                .filter(|row| {
                    row["dir"]
                        .as_str()
                        .map(|d| d.starts_with(&prefix))
                        .unwrap_or(false)
                })
                .collect()
        })
        .unwrap_or_default()
}

fn row_named<'a>(rows: &[&'a Json], name: &str) -> &'a Json {
    rows.iter()
        .find(|r| r["name"] == json!(name))
        .unwrap_or_else(|| panic!("no skill named {name} in {rows:?}"))
}

#[test]
fn skill_list_reads_user_and_project_skills_and_the_disabled_suffix() {
    let home = TempHome::new("skills");
    home.write(
        "skills/release-notes/SKILL.md",
        "---\nname: release-notes\ndescription: Drafts release notes from the commit range since the last tag.\n---\n",
    );
    home.write(
        "skills/stale-check.disabled/SKILL.md",
        "---\nname: stale-check\n---\n",
    );
    // A directory with no manifest is not a skill and must not be listed.
    std::fs::create_dir_all(home.join("skills/not-a-skill")).unwrap();
    home.write(
        "project/.codex/skills/repo-triage/SKILL.md",
        "---\nname: repo-triage\n---\n",
    );

    let cwd = home.join("project").display().to_string();
    let list = catalog::skill_list(Some(&cwd));
    // The scanner also reads the machine's real `~/.agents/skills`, so assert
    // against the rows under this test's temporary home rather than the total.
    let rows = rows_under(&list, &home.path);
    assert_eq!(rows.len(), 3, "{list}");

    let release = row_named(&rows, "release-notes");
    assert_eq!(release["enabled"], json!(true));
    assert_eq!(release["source"], json!("user"));
    assert_eq!(
        release["desc"],
        json!("Drafts release notes from the commit range since the last tag.")
    );
    assert!(release["path"].as_str().unwrap().ends_with("SKILL.md"));

    let stale = row_named(&rows, "stale-check");
    assert_eq!(
        stale["enabled"],
        json!(false),
        "the `.disabled` suffix is what turns a skill off"
    );
    assert!(
        stale["dir"].as_str().unwrap().ends_with(".disabled"),
        "the directory keeps the suffix even though the name drops it"
    );

    let triage = row_named(&rows, "repo-triage");
    assert_eq!(triage["source"], json!("project"));
}

#[test]
fn skill_toggle_renames_the_directory_both_ways() {
    let home = TempHome::new("skill-toggle");
    let manifest = home.write(
        "skills/release-notes/SKILL.md",
        "---\nname: release-notes\n---\n",
    );
    let dir = manifest.parent().unwrap().display().to_string();

    let off = catalog::skill_toggle(&dir).unwrap();
    let disabled = off["to"].as_str().unwrap().to_string();
    assert!(disabled.ends_with(".disabled"), "{disabled}");
    assert!(!PathBuf::from(&dir).exists());
    assert!(PathBuf::from(&disabled).join("SKILL.md").is_file());

    let list = catalog::skill_list(None);
    let rows = rows_under(&list, &home.path);
    assert_eq!(row_named(&rows, "release-notes")["enabled"], json!(false));

    let on = catalog::skill_toggle(&disabled).unwrap();
    // Compared as paths, not as strings: the fixture joins with `/` and the
    // rename joins with the platform separator.
    assert_eq!(
        PathBuf::from(on["to"].as_str().unwrap()),
        PathBuf::from(&dir),
        "toggling back must restore the exact directory"
    );
    let list = catalog::skill_list(None);
    let rows = rows_under(&list, &home.path);
    assert_eq!(row_named(&rows, "release-notes")["enabled"], json!(true));
}

#[test]
fn skill_toggle_refuses_a_directory_that_is_not_a_skill() {
    let home = TempHome::new("skill-toggle-bad");
    let dir = home.join("skills/empty");
    std::fs::create_dir_all(&dir).unwrap();
    let err = catalog::skill_toggle(&dir.display().to_string()).unwrap_err();
    assert!(err.contains("is not a skill directory"), "{err}");
    assert!(
        dir.exists(),
        "a refused toggle must leave the directory alone"
    );
}

/* ------------------------------------------------------- catalog: sessions */

#[test]
fn session_list_reads_the_rollout_header_of_each_transcript() {
    let home = TempHome::new("sessions");
    home.write(
        "sessions/2026/07/29/rollout-2026-07-29T14-12-00-0f2c1a54.jsonl",
        "{\"type\":\"session_meta\",\"payload\":{\"id\":\"0f2c1a54-1b7d-4c2b-9c31-2a6f0d51e7aa\",\"cwd\":\"C:/Users/ding/code/codex\",\"originator\":\"codex_tui\",\"cli_version\":\"0.58.0\"}}\n{\"type\":\"message\",\"payload\":{}}\n",
    );
    home.write(
        "archived_sessions/rollout-2026-07-27T03-02-00-3aa61f88.jsonl",
        "{\"type\":\"session_meta\",\"payload\":{\"id\":\"3aa61f88\",\"cwd\":\"/srv/ci\",\"originator\":\"codex_exec\"}}\n",
    );
    // No usable header: the id falls back to the tail of the file name.
    home.write(
        "sessions/session-rollout-ffeeddcc.jsonl",
        "not json at all\n",
    );
    // Not a transcript, and must be ignored rather than parsed.
    home.write("sessions/notes.txt", "ignore me\n");

    let list = catalog::session_list(300);
    let rows = list.as_array().expect("session_list must return an array");
    assert_eq!(rows.len(), 3, "{list}");

    let find = |id: &str| {
        rows.iter()
            .find(|r| r["id"] == json!(id))
            .unwrap_or_else(|| panic!("no session {id} in {list}"))
    };

    let live = find("0f2c1a54-1b7d-4c2b-9c31-2a6f0d51e7aa");
    assert_eq!(live["archived"], json!(false));
    assert_eq!(live["interactive"], json!(true));
    assert_eq!(live["cliVersion"], json!("0.58.0"));
    assert_eq!(
        live["name"],
        json!("codex"),
        "an unnamed session is labelled by the folder it ran in"
    );

    let archived = find("3aa61f88");
    assert_eq!(archived["archived"], json!(true));
    assert_eq!(
        archived["interactive"],
        json!(false),
        "a `codex exec` run is not an interactive session"
    );

    let headerless = find("ffeeddcc");
    assert_eq!(headerless["archived"], json!(false));
    assert_eq!(headerless["cwd"], json!(""));

    assert_eq!(
        catalog::session_list(2).as_array().map(|a| a.len()),
        Some(2),
        "the limit must actually truncate"
    );
}

#[test]
fn session_list_is_empty_in_a_fresh_home() {
    let _home = TempHome::new("sessions-empty");
    assert_eq!(catalog::session_list(300), json!([]));
}

/* ----------------------------------------------------------- catalog: auth */

#[test]
fn auth_status_degrades_instead_of_failing_when_the_cli_is_missing() {
    let home = TempHome::new("auth");
    let status = catalog::auth_status();
    assert_eq!(
        status["method"],
        json!("unknown"),
        "a machine with no Codex CLI must still render the account panel"
    );
    assert!(
        status["error"].as_str().unwrap_or("").contains(MISSING_BIN),
        "the panel needs to say which command could not be run: {status}"
    );
    assert_eq!(status["account"], Json::Null);

    // With an auth.json present the store is reported as file-backed.
    home.write("auth.json", "{}\n");
    let status = catalog::auth_status();
    assert_eq!(status["method"], json!("unknown"));
}

/* --------------------------------------------------------------- editors */

#[test]
fn opening_a_path_that_does_not_exist_reports_the_path() {
    let home = TempHome::new("editors");
    let missing = home.join("no-such-file.rs").display().to_string();

    let err = editors::open(&missing, None, None).unwrap_err();
    assert!(err.contains(&missing), "{err}");
    assert!(err.contains("does not exist"), "{err}");

    let err = editors::reveal(&missing).unwrap_err();
    assert!(err.contains("does not exist"), "{err}");
}

#[test]
fn detect_reports_a_well_formed_list_of_editors() {
    // Detection only probes for executables, so this is safe to run anywhere: a
    // machine with nothing installed reports an empty list rather than failing.
    let found = editors::detect();
    let editors = found["editors"]
        .as_array()
        .expect("detect must always return an `editors` array");
    for editor in editors {
        for key in ["id", "label", "exe"] {
            assert!(
                editor[key].as_str().map(|s| !s.is_empty()).unwrap_or(false),
                "every detected editor needs a non-empty `{key}`: {editor}"
            );
        }
        assert!(editor["args"].is_array(), "{editor}");
    }
}

/* ------------------------------------------------------------------- wsl */

#[test]
fn wsl_args_accept_the_payload_the_gui_sends() {
    let full: wsl::WslArgs = serde_json::from_value(json!({
        "session": "tab-3",
        "distro": "Ubuntu-24.04",
        "cwd": "/mnt/c/Users/ding/code",
        "command": "codex --version",
        "auto": false
    }))
    .expect("the GUI's WSL payload must deserialise");
    assert_eq!(full.session, "tab-3");
    assert_eq!(full.distro.as_deref(), Some("Ubuntu-24.04"));
    assert_eq!(full.command.as_deref(), Some("codex --version"));
    assert_eq!(full.auto, Some(false));
    assert!(full.patch.is_none());

    // Only the session id is required; a stop/kill call carries nothing else.
    let minimal: wsl::WslArgs =
        serde_json::from_value(json!({ "session": "tab-1" })).expect("session alone must suffice");
    assert_eq!(minimal.session, "tab-1");
    assert!(minimal.distro.is_none());
    assert!(minimal.cwd.is_none());
}

#[test]
fn wsl_stop_reports_an_unknown_session_as_absent() {
    let runtimes = wsl::Runtimes::default();
    let out = wsl::stop(&runtimes, "never-started");
    assert_eq!(out["session"], json!("never-started"));
    assert_eq!(
        out["status"],
        json!("absent"),
        "stopping a session that was never spawned is not an error"
    );
}
