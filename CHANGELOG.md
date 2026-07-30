# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-30

### Added
- gPodder API v2 compatible podcast sync server
- Authentication with HTTP Basic Auth
- Auto-registration of new users via `AUTO_REGISTER` flag
- Subscription management (add/remove/list per device)
- Episode action tracking (play, download, delete with position sync)
- CLI for user management (create, list, update password)
- SQLite database with WAL mode and SQL migrations
- Health check endpoint (`/` and `/health`)
- Docker support with multi-stage Alpine-based build
- CI pipeline with lint and test checks
- Standalone binary compilation via `bun build --compile`

[1.0.0]: https://github.com/podhound/podhound/releases/tag/v1.0.0
