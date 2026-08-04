---
title: "FAQ & Troubleshooting"
type: docs
---

# ❓ Frequently Asked Questions (FAQ)

Find quick answers to common questions about running, configuring, and maintaining Podhound.

---

### 📱 How do I connect AntennaPod on Android?
1. Open **AntennaPod** -> Settings -> Synchronization.
2. Choose **gPodder.net / Custom Server**.
3. Enter your Podhound server URL (e.g. `http://192.168.1.100:8080` or `https://podhound.yourdomain.com`).
4. Enter your username and password.
5. Tap **Log In** and select your device name.

---

### 🔒 How do I disable new user registrations?
Set the `AUTO_REGISTER` environment variable to `false` in your Docker or binary setup:
```env
AUTO_REGISTER=false
```
Once set, only existing users can log in, and new account registration attempts will be rejected.

---

### 💾 Where are my data stored and how do I back it up?
All subscriptions and episode progress are stored in a single SQLite database file (by default `/app/data/podhound.db` inside the Docker volume).

To create a backup, copy the database file or Docker volume:
```bash
# Copy SQLite database file directly
cp /var/lib/docker/volumes/podhound_data/_data/podhound.db ./podhound_backup.db
```

---

### ⚡ What are the system resource requirements?
Podhound is built with **Bun** and **SQLite**, making it extremely fast and lightweight:
- **RAM:** ~20-30 MB RAM idle/active
- **CPU:** Minimal CPU usage
- **Disk:** ~15 MB compiled binary / Docker image

---

### 🌐 How do I set up HTTPS reverse proxy?
You can put Podhound behind any reverse proxy.

**Nginx Example:**
```nginx
server {
    server_name podhound.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy Example:**
```caddy
podhound.yourdomain.com {
    reverse_proxy localhost:8080
}
```
