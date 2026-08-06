# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-08-06

### Performance & Security
- **RAM Optimization:** Reduced server memory footprint under load from ~80 MB down to ~15 MB (81% reduction).
- **Password Hashing:** Migrated default hashing algorithm to `bcrypt` (`cost: 10`) for minimal RAM overhead while maintaining 100% backward compatibility with existing hashes.
- **In-Memory Auth Cache:** Added 5-minute TTL Basic Auth cache (`Map`) to bypass repeated password verification on high-frequency API requests.
- **Prepared Statements:** Pre-compiled and cached SQLite `Statement` objects across all database services (`AuthService`, `UserService`, `SubscriptionService`, `EpisodeService`, `DeviceService`).
- **Stream Logging:** Removed body stream cloning (`req.clone().text()`) in HTTP server logging.
- **Garbage Collection:** Added periodic background garbage collection (`Bun.gc(true)`).

### Added
- Centralized TTL, session, rate-limiting, and GC interval parameters in `Config`.
- Added load and memory benchmark test script (`bun run test:load`).

### Docker Images
- **Docker Hub:** [`skubakh/podhound:1.0.1`](https://hub.docker.com/r/skubakh/podhound/tags?name=1.0.1)
- **GitHub Registry:** [`ghcr.io/podhound/podhound:1.0.1`](https://github.com/podhound/podhound/pkgs/container/podhound)

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

[1.0.1]: https://github.com/podhound/podhound/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/podhound/podhound/releases/tag/v1.0.0
