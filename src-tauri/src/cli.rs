//! Every backend capability is a real `codex` invocation. Nothing about the agent,
//! the sandbox or the config schema is reimplemented here — this module only knows
//! how to find the binary, run it, and hand the output back verbatim.

use std::io::BufRead;
use std::io::BufReader;
use std::path::PathBuf;
use std::process::Command;
use std::process::Stdio;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// Keep spawned console processes from flashing a window over the GUI.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub fn codex_home() -> PathBuf {
    std::env::var("CODEX_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| dirs::home_dir().unwrap_or_default().join(".codex"))
}

pub fn codex_bin() -> String {
    std::env::var("CODEX_BIN").unwrap_or_else(|_| "codex".to_string())
}

/// A `Command` for the given program with the console window suppressed on Windows.
pub fn command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

pub struct Output {
    pub code: i32,
    pub stdout: String,
    pub stderr: String,
}

impl Output {
    pub fn ok(&self) -> bool {
        self.code == 0
    }
}

/// Run `codex <args>` to completion and capture both streams.
pub fn run(args: &[&str]) -> Result<Output, String> {
    run_in(args, None)
}

pub fn run_in(args: &[&str], cwd: Option<&str>) -> Result<Output, String> {
    let bin = codex_bin();
    let mut cmd = command(&bin);
    cmd.args(args);
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    let out = cmd
        .output()
        .map_err(|e| format!("could not run `{bin} {}`: {e}", args.join(" ")))?;
    Ok(Output {
        code: out.status.code().unwrap_or(-1),
        stdout: String::from_utf8_lossy(&out.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&out.stderr).into_owned(),
    })
}

/// Run a subcommand that emits JSON on stdout and parse it.
///
/// Some Codex subcommands print a human banner before the JSON body, so the parse
/// retries from the first `{`/`[` rather than failing the whole call.
pub fn run_json(args: &[&str]) -> Result<serde_json::Value, String> {
    let out = run(args)?;
    if !out.ok() && out.stdout.trim().is_empty() {
        return Err(format!(
            "`codex {}` exited {}: {}",
            args.join(" "),
            out.code,
            out.stderr.trim()
        ));
    }
    parse_loose_json(&out.stdout).ok_or_else(|| {
        format!(
            "`codex {}` did not return JSON: {}",
            args.join(" "),
            out.stdout.chars().take(200).collect::<String>()
        )
    })
}

pub fn parse_loose_json(text: &str) -> Option<serde_json::Value> {
    if let Ok(v) = serde_json::from_str::<serde_json::Value>(text.trim()) {
        return Some(v);
    }
    let start = text.find(['{', '['])?;
    serde_json::from_str::<serde_json::Value>(text[start..].trim()).ok()
}

/// One line of process output, tagged so the GUI can style it.
#[derive(serde::Serialize, Clone)]
pub struct Line {
    pub level: String,
    pub text: String,
}

impl Line {
    pub fn new(level: &str, text: impl Into<String>) -> Self {
        Line {
            level: level.into(),
            text: text.into(),
        }
    }
}

/// Spawn a program and stream both stdout and stderr concurrently, invoking `emit`
/// for every line as it arrives. Returns the collected lines and the exit code.
///
/// stdout and stderr are drained on separate threads: reading them in sequence
/// deadlocks as soon as the child fills the pipe the reader is not draining.
pub fn stream<F>(
    program: &str,
    args: &[String],
    cwd: Option<&str>,
    mut emit: F,
) -> Result<(i32, Vec<Line>), String>
where
    F: FnMut(&Line) + Send,
{
    let mut cmd = command(program);
    cmd.args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    let mut child = cmd
        .spawn()
        .map_err(|e| format!("could not start `{program}`: {e}"))?;

    let (tx, rx) = std::sync::mpsc::channel::<Line>();
    let mut readers = Vec::new();
    if let Some(stdout) = child.stdout.take() {
        let tx = tx.clone();
        readers.push(std::thread::spawn(move || {
            for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                let _ = tx.send(Line::new("out", line));
            }
        }));
    }
    if let Some(stderr) = child.stderr.take() {
        let tx = tx.clone();
        readers.push(std::thread::spawn(move || {
            for line in BufReader::new(stderr).lines().map_while(Result::ok) {
                let _ = tx.send(Line::new("error", line));
            }
        }));
    }
    drop(tx);

    let mut lines = Vec::new();
    for line in rx {
        emit(&line);
        lines.push(line);
    }
    for r in readers {
        let _ = r.join();
    }
    let status = child.wait().map_err(|e| e.to_string())?;
    Ok((status.code().unwrap_or(-1), lines))
}
