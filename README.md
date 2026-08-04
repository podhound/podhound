# Podhound

[![Website](https://img.shields.io/badge/Website-podhound.github.io-blue?logo=googlechrome&logoColor=white)](https://podhound.github.io)
[![Config Generator](https://img.shields.io/badge/Docker_Config-Interactive_Generator-success?logo=docker&logoColor=white)](https://podhound.github.io/config/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/podhound/podhound/ci.yml?label=CI&logo=github)](https://github.com/podhound/podhound/actions)
[![Release](https://img.shields.io/github/v/release/podhound/podhound?logo=github)](https://github.com/podhound/podhound/releases)
[![Docker Pulls](https://img.shields.io/docker/pulls/skubakh/podhound?logo=docker)](https://hub.docker.com/r/skubakh/podhound)
[![GHCR Container](https://img.shields.io/github/v/tag/podhound/podhound?label=ghcr.io&logo=docker&color=2496ED)](https://github.com/podhound/podhound/pkgs/container/podhound)

<img src="assets/logo.png" alt="Podhound Logo" width="120" align="right">

A simple, lightweight self-hosted podcast sync server implementing the [gPodder API v2](https://gpoddernet.readthedocs.io/en/latest/api/index.html).

Podhound doggedly tracks your podcast subscriptions and playback progress across devices. Fully compatible with [AntennaPod](https://antennapod.org/), [gPodder Desktop](https://gpodder.github.io/), [Kasts](https://apps.kde.org/kasts/), and other gPodder API v2 clients.

<br clear="all">

---

## 🌐 Quick Links & Resources

* 📖 **Official Website & Docs:** [podhound.github.io](https://podhound.github.io)
* 🛠️ **Interactive Config Generator:** [podhound.github.io/config](https://podhound.github.io/config/)
* 📱 **Compatible Clients Guide:** [podhound.github.io/docs/clients](https://podhound.github.io/docs/clients/)
* ❓ **FAQ & Troubleshooting:** [podhound.github.io/docs/faq](https://podhound.github.io/docs/faq/)
* 👤 **Author:** [Svyatoslav Kubakh](https://kubakh.name/)

---

## ⚡ Quick Start

Run the container:

```bash
docker run -d \
    --name podhound \
    -p 8080:8080 \
    -v podhound_data:/app/data \
    -e PORT=8080 \
    -e DATABASE_PATH=/app/data/podhound.db \
    -e AUTO_REGISTER=false \
    --restart unless-stopped \
    skubakh/podhound:latest
```

> [!TIP]
> Use our **[Interactive Config Generator](https://podhound.github.io/config/)** to generate custom `docker-compose.yml` or `docker run` commands with 1 click.

---

## 🛠 Tech Stack

* **Runtime:** [Bun](https://bun.sh/) (TypeScript)
* **Database:** SQLite via native `bun:sqlite`
* **API:** gPodder API v2
* **Single Binary:** Built with `bun build --compile`
* **Container:** Multi-stage Docker image (Alpine-based)

---

## 💖 Support & Sponsorship

If Podhound saved you time or made your podcast self-hosting experience smoother, consider supporting the project:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Donate-ff5e5b?logo=ko-fi&logoColor=white)](https://ko-fi.com/skubakh)
[![Donatello](https://img.shields.io/badge/Donatello-Donate-00ccaa?logo=heart&logoColor=white)](https://donatello.to/skubakh)

---

## 📜 License

[MIT](LICENSE)
