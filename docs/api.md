# gPodder API v2 Endpoints

Podhound implements the essential gPodder API v2 endpoints to allow synchronization with standard podcatchers.

All API endpoints require **HTTP Basic Auth** (username + password).

## Authentication

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/2/auth/<username>/login.json` | Authenticate and receive a session cookie. Also accepts JSON body `{ "password": "..." }`. |

## Devices

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/2/devices/<username>.json` | List registered devices for the user. |
| `POST` | `/api/2/devices/<username>/<device_id>.json` | Register or update a device. |

## Subscriptions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/2/subscriptions/<username>/<device>.json` | Get the list of podcast subscriptions. |
| `POST` | `/api/2/subscriptions/<username>/<device>.json` | Update subscriptions. Body: `{ "add": [...], "remove": [...] }`. |

## Episode Actions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/2/episodes/<username>.json` | Get episode actions. Supports `?since=<timestamp>` and `?podcast=<url>` query params. |
| `POST` | `/api/2/episodes/<username>.json` | Upload episode actions. Body: array of `EpisodeActionPayload` objects. |

## Health Check

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` or `/health` | Returns service status and API version info. |
