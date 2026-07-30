// Thin launcher. Everything the app does lives in the library crate so the whole
// backend stays unit-testable without starting a window.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    codex_studio::run();
}
