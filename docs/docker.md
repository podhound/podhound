---
title: "Docker Deployment Guide"
type: docs
---

# Docker Deployment Guide

Deploy Podhound using Docker or Docker Compose in seconds.

> [!TIP]
> Use our **[Interactive Config Generator](../../config/)** to generate a custom `docker-compose.yml` or `docker run` command with 1 click.

---

## Option A: Via `docker run`

Run the container by mapping the HTTP port and persisting the database volume:

```bash
docker run -d \
  --name podhound \
  -p 8080:8080 \
  -v podhound_data:/app/data \
  -e PORT=8080 \
  -e DATABASE_PATH=/app/data/podhound.db \
  -e AUTO_REGISTER=true \
  --restart unless-stopped \
  skubakh/podhound:latest
```

## Option B: Via `docker-compose.yml`

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  podhound:
    image: skubakh/podhound:latest
    container_name: podhound
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - DATABASE_PATH=/app/data/podhound.db
      - AUTO_REGISTER=true
    volumes:
      - podhound_data:/app/data
    restart: unless-stopped

volumes:
  podhound_data:
```

Start the service:

```bash
docker compose up -d
```

> [!NOTE]
> For a full list of available settings, please refer to the **[Environment Variables](environment.md)** documentation.
