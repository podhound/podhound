# 🐾 Podhound

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-v1.x-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-v7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI Pipeline](https://github.com/svyatoslav-kubakh/podhound/actions/workflows/ci.yml/badge.svg)](https://github.com/svyatoslav-kubakh/podhound/actions)
[![Latest Release](https://img.shields.io/github/v/release/svyatoslav-kubakh/podhound)](https://github.com/svyatoslav-kubakh/podhound/releases)
[![Docker Pulls](https://img.shields.io/docker/pulls/skubakh/podhound)](https://hub.docker.com/r/skubakh/podhound)

<img src="assets/logo.png" alt="Podhound Logo" width="120" align="right">

**A lightweight, self-hosted podcast sync server.**

It doggedly tracks your subscriptions and playback progress, so you can seamlessly pick up right where you left off on any device.

<br clear="all">

---

## 🛠️ Tech Stack

* **Runtime & Package Manager:** [Bun](https://bun.sh/) (TypeScript v7) — instant startup with zero compilation delay.
* **Database:** SQLite powered by the native high-performance `bun:sqlite` module (with `PRAGMA journal_mode = WAL` and `foreign_keys` enabled).
* **API Protocol:** [gPodder API v2](https://gpoddernet.readthedocs.io/en/latest/api/index.html) — full compatibility with mobile clients like **AntennaPod**, gPodder Desktop, etc.
* **Build / Compiling:** `bun build --compile` — compiles into **1 single standalone binary** with embedded `.sql` migrations without external runtime dependencies.
* **Containerization:** Multi-stage `Dockerfile` based on lightweight Alpine Linux.

---

## 📚 Documentation

For more detailed guides, check out the `docs/` directory:

* [🐳 Docker Deployment Guide](docs/docker.md)
* [💻 Developer Guide](docs/development.md)
* [⚙️ Environment Variables](docs/environment.md)
* [🔌 gPodder API v2 Endpoints](docs/api.md)
* [📱 AntennaPod Setup Guide](docs/setup.md)
* [⌨️ Command Line Interface (CLI)](docs/cli.md)

---

## 📜 License

Distributed under the [MIT](LICENSE) License.
