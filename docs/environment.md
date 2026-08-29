# Configuration / Environment Variables

Podhound is configured entirely via environment variables.

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | HTTP port the server listens on | `8080` |
| `DATABASE_PATH` | Path to the SQLite database file | `data/podhound.db` (or `/app/data/podhound.db` in Docker) |
| `AUTO_REGISTER` | Automatically register new users upon first login (`true` or `false`) | `false` (`true` in Docker) |
| `LOG_LEVEL` | Minimum log level (`debug`, `info`, `warn`, `error`, `silent`) | `info` (`silent` in test) |
| `DEFAULT_USER_SETTINGS` | Global fallback defaults for user settings in JSON format (e.g. `'{"action_map_delete":"replace_play"}'`) | `"{}"` |

## User Settings Options

Settings defined in `DEFAULT_USER_SETTINGS` or per-user profiles:

* **`action_map_delete`**: Defines how episode `delete` actions from clients are processed:
  * `"none"` *(default)*: Standard gPodder behavior; stores `delete` action as-is.
  * `"replace_play"`: Transforms `delete` actions into `play` actions. This automatically dismisses/removes deleted episodes from the Inbox across synchronized devices in clients like AntennaPod.
  * `"prepend_play"`: Generates a preceding `play` action before storing the `delete` action.
