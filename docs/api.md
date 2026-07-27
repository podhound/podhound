# gPodder API v2 Endpoints

Podhound implements the essential gPodder API v2 endpoints to allow synchronization with standard podcatchers.

## Authentication & Devices

* `POST /api/2/auth/<username>/login.json`
  Authenticates user (HTTP Basic Auth or JSON payload) and establishes a session.

* `GET` / `POST /api/2/devices/<username>.json`
  List and register client devices.

## Subscriptions Synchronization

* `GET /api/2/subscriptions/<username>/<device>.json`
  Returns array of subscribed podcast URLs.

* `POST /api/2/subscriptions/<username>/<device>.json`
  Accepts subscription delta `{ "add": [...], "remove": [...] }`.

## Playback Progress Synchronization (Episode Actions)

* `POST /api/2/episodes/<username>.json`
  Saves episode playback actions (positions, play/flattr/delete status).

* `GET /api/2/episodes/<username>.json?since=<timestamp>`
  Retrieves array of episode actions since given Unix epoch timestamp.
