# Podhound

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/svyatoslav-kubakh/podhound/ci.yml?label=CI&logo=github)](https://github.com/svyatoslav-kubakh/podhound/actions)
[![Release](https://img.shields.io/github/v/release/svyatoslav-kubakh/podhound?logo=github)](https://github.com/svyatoslav-kubakh/podhound/releases)
[![Docker Pulls](https://img.shields.io/docker/pulls/skubakh/podhound?logo=docker)](https://hub.docker.com/r/skubakh/podhound)

<img src="assets/logo.png" alt="Podhound Logo" width="120" align="right">

Simple self-hosted podcast sync server ([gPodder API v2](https://gpoddernet.readthedocs.io/en/latest/api/index.html) compatible).

Created this because I wanted a lightweight server to keep podcast subscriptions and playback progress synced between [AntennaPod](https://antennapod.org/) on my phone and desktop apps like [gPodder](https://gpodder.github.io/), without relying on third-party services.

<br clear="all">

---

## 🛠 Tech Stack

* **Runtime:** [Bun](https://bun.sh/) (TypeScript)
* **Database:** SQLite via native `bun:sqlite`
* **API:** gPodder API v2 (works out of the box with [AntennaPod](https://antennapod.org/), [gPodder Desktop](https://gpodder.github.io/), etc.)
* **Single Binary:** Built with `bun build --compile`
* **Container:** Multi-stage Docker image (Alpine-based)

---

## 📚 Documentation

Check the `docs/` folder for guides and setup details:

* [Docker Deployment Guide](docs/docker.md)
* [Developer Guide](docs/development.md)
* [Environment Variables](docs/environment.md)
* [gPodder API v2 Endpoints](docs/api.md)
* [AntennaPod Setup Guide](docs/setup.md)
* [CLI Usage](docs/cli.md)

---

## 📜 License

[MIT](LICENSE)
