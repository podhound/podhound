# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-30

### Added
- User settings system with global `DEFAULT_USER_SETTINGS` and CLI management.
- Episode action mapping (`action_map_delete`) for cross-device inbox sync.

### Fixed
- Format episode action timestamps as ISO-8601 strings for AntennaPod.

## [1.0.2] - 2026-08-10

### Changed
- Auto-migrate legacy Argon2id password hashes to Bcrypt on login.

## [1.0.1] - 2026-08-06

### Performance
- Reduced RAM usage under load from 80 MB to 15 MB.
- Switched default password hashing from Argon2id to Bcrypt.
- Added in-memory Basic Auth cache and pre-compiled SQLite statements.
- Added periodic background garbage collection.

## [1.0.0] - 2026-07-30

### Added
- Initial release of gPodder API v2 podcast sync server.
- Support for subscriptions, episode actions, CLI, and SQLite WAL.

[1.1.0]: https://github.com/podhound/podhound/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/podhound/podhound/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/podhound/podhound/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/podhound/podhound/releases/tag/v1.0.0
