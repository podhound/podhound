# 👤 User Settings & Action Mapping

Podhound supports an extensible user settings system stored as JSON in SQLite. Settings control behavioral policies such as episode action transformations and client synchronization workarounds.

---

## 🏛️ Cascading Resolution (3-Tier Precedence)

Settings follow a 3-tier fallback hierarchy:

$$\text{System Default in Code ("none")} \longrightarrow \text{Global Fallback (DEFAULT\_USER\_SETTINGS)} \longrightarrow \text{User Profile (users.settings)}$$

1. **User Profile (`users.settings` in DB):** Explicitly set for a user via CLI (or upcoming Web Dashboard). Overrides all global defaults.
2. **Global Fallback (`DEFAULT_USER_SETTINGS` in ENV):** Applied to all users (including auto-registered users) who have not explicitly overridden the setting.
3. **System Default (in code):** The safe baseline according to the standard gPodder API v2 specification.

---

## ⚙️ Available Settings

### `action_map_delete`

Defines how incoming episode `delete` actions sent by podcast apps are handled.

| Value | Behavior | Use Case |
| :--- | :--- | :--- |
| **`"none"`** *(default)* | Stores `delete` actions unmodified as defined by gPodder API v2. | Standard gPodder clients and purist setup. |
| **`"replace_play"`** *(recommended for AntennaPod)* | Replaces the `delete` action with a `play` action (`position = total`). | **AntennaPod Inbox Sync:** Automatically dismisses/removes deleted episodes from the Inbox across all synchronized devices. |
| **`"prepend_play"`** | Generates a synthetic `play` action timestamped 1 second earlier, followed by the `delete` action. | Preserves the `delete` record while still triggering Inbox removal on clients. |

---

## 📱 AntennaPod Inbox Synchronization Context

In podcast clients like [AntennaPod](https://antennapod.org/), the **Inbox** (new episodes feed) is tracked locally per device. The gPodder API v2 standard does not define a dedicated "dismiss from inbox" action.

However, when an episode is marked as **played** (`action = "play"` at 100% progress), AntennaPod automatically removes it from the Inbox on all connected devices during sync.

By enabling `action_map_delete: "replace_play"`:
* When you delete an episode or swipe it away, Podhound saves it as played.
* During the next sync on your tablet or second phone, AntennaPod removes that episode from its Inbox automatically.

---

## 🛠️ Managing Settings

### 1. Global Defaults via Docker / Environment Variables

Set `DEFAULT_USER_SETTINGS` in your `docker-compose.yml` or `.env` file as a JSON object:

```env
# docker-compose.yml or .env
DEFAULT_USER_SETTINGS='{"action_map_delete":"replace_play"}'
```

Every user (including accounts created via `AUTO_REGISTER=true`) will automatically inherit this policy.

---

### 2. Per-User Management via CLI

You can inspect or override settings for individual users at any time:

#### View User Settings
```bash
# Via Docker
docker exec -it podhound podhound users get-settings <username>

# Via local binary
./dist/podhound users get-settings <username>
```

Output:
```json
{
  "settings": {
    "action_map_delete": "replace_play"
  },
  "effective": {
    "action_map_delete": "replace_play"
  }
}
```

#### Change a Setting for a User
```bash
# Set action_map_delete to replace_play
docker exec -it podhound podhound users set-setting <username> action_map_delete replace_play

# Revert to standard gPodder behavior
docker exec -it podhound podhound users set-setting <username> action_map_delete none
```
