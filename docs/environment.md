# Configuration / Environment Variables

Podhound is configured entirely via environment variables.

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | HTTP port the server listens on | `8080` |
| `DATABASE_PATH` | Path to the SQLite database file | `data/podhound.db` (or `/app/data/podhound.db` in Docker) |
| `AUTO_REGISTER` | Automatically register new users upon first login (`true` or `false`) | `false` (`true` in Docker) |
| `LOG_LEVEL` | Minimum log level (`debug`, `info`, `warn`, `error`, `silent`) | `info` (`silent` in test) |
| `DEFAULT_USER_SETTINGS` | Global fallback defaults for user settings in JSON format (e.g. `'{"action_map_delete":"replace_play"}'`) | `"{}"` |

For detailed information on available user settings, action mapping policies, and AntennaPod sync, see the **[User Settings Documentation](user-settings.md)**.
