# API

## Codex Studio exposes no HTTP API

There is no web server, no REST or GraphQL endpoint, no gRPC service and no socket. Nothing in
this repository binds a port, and nothing in it accepts a request from another process.

**Therefore no Postman collection applies to this project**, and none is maintained. That is not
an omission to be filled in later — a Postman collection for a desktop app with no network surface
would be a fabricated artifact, and inventing one would be worse than having none.

## Where the real interface is documented

Codex Studio's only programmatic boundary is Tauri IPC between the WebView frontend and the Rust
backend. Every one of its 47 commands — arguments, return shapes, error strings, the streaming
event contract, and the security properties of each — is documented in:

### → [../architecture/tauri-bridge.md](../architecture/tauri-bridge.md)

That is the file to read, to keep current, and to point a reviewer at when they ask "what is the
API surface?".

## How to be sure this is still true

```bash
# No HTTP server, no listener, no socket in the Rust backend — expect no output
grep -rniE "axum|actix|warp|hyper::server|tiny_http|TcpListener|bind\(" src-tauri/src/

# Every network-shaped call in the frontend — expect only same-origin ones
grep -rnE "fetch\(|XMLHttpRequest|WebSocket|EventSource" app/*.js app/index.html
```

The first must produce nothing. The second is **not** empty, and both hits are same-origin by
construction:

- `app/index.html` — `fetch("./CHANGELOG.md")`, a relative path resolved against the app's own
  origin, with a fall back to the `codex_read_text` IPC command when it fails.
- `app/support.js` — the generic `dc-runtime` module/template loader. The shipped app imports no
  external module, so these paths are unused here.

Neither can reach another host: `connect-src` below admits only `'self'` and the IPC origin, so an
absolute URL would be blocked by the browser regardless of what the code asked for. A review of a
new `fetch` should confirm the URL is relative, not that `fetch` is absent.

The Rust crate's entire dependency list is `tauri`,
`tauri-plugin-shell`, `tauri-plugin-dialog`, `tauri-plugin-os`, `serde`, `serde_json`, `toml` and
`dirs` (`src-tauri/Cargo.toml`) — there is no HTTP framework and no HTTP client among them.

The frontend is held to the same standard by the Content Security Policy in
`src-tauri/tauri.conf.json`:

```
default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self';
img-src 'self' data: blob:; script-src 'self' 'unsafe-inline';
connect-src 'self' ipc: http://ipc.localhost; media-src 'self' data:
```

`connect-src` admits only the app's own origin and the Tauri IPC pseudo-origin. A `fetch()` to any
external host fails at the browser level, regardless of what the code intends. React, Roboto,
Roboto Mono and every asset are vendored under `app/` for exactly this reason.

## What this means for a contributor

- **Do not add an HTTP client** to reach an external service. If a feature needs data from
  outside, it comes from the `codex` CLI, which already owns authentication, proxying and the
  user's consent to talk to a network.
- **Do not add a local server** to bridge the frontend and backend. `invoke` already exists, is
  capability-gated, and is not reachable from another process on the machine.
- **If an HTTP surface is ever genuinely added**, this page stops being accurate. At that point
  create `docs/api/<name>.md` describing it, add a real Postman collection exported from a working
  request set, and link it from this index and from the master
  [documentation index](../README.md).

## Related

| Page | Why |
| --- | --- |
| [../architecture/tauri-bridge.md](../architecture/tauri-bridge.md) | The complete IPC command surface |
| [../architecture/overview.md](../architecture/overview.md) | Why every capability is a real CLI invocation rather than a service call |
| [../build/packaging.md](../build/packaging.md) | The CSP and capability allowlist as they ship in the installer |
