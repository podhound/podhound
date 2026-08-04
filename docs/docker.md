---
title: "Docker Deployment Guide"
type: docs
---

# Docker Deployment Guide

Deploy Podhound using Docker or Docker Compose in seconds.

---

<div class="docker-generator-box" style="background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
  <h3 style="margin-top: 0;">🛠️ Interactive Config Generator</h3>
  <p style="font-size: 0.9em; opacity: 0.8; margin-bottom: 15px;">Customize your deployment settings below to generate a tailored <code>docker-compose.yml</code> or <code>docker run</code> command.</p>
  
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 5px;">Registry Source:</label>
      <select id="gen-registry" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--gray-500); background: var(--body-background); color: var(--body-font-color);">
        <option value="skubakh/podhound:latest">🐳 Docker Hub (skubakh/podhound:latest)</option>
        <option value="ghcr.io/podhound/podhound:latest">🐙 GHCR (ghcr.io/podhound/podhound:latest)</option>
      </select>
    </div>
    
    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 5px;">Host Port:</label>
      <input type="number" id="gen-port" value="8080" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--gray-500); background: var(--body-background); color: var(--body-font-color);">
    </div>
    
    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 5px;">Container Name:</label>
      <input type="text" id="gen-name" value="podhound" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--gray-500); background: var(--body-background); color: var(--body-font-color);">
    </div>
    
    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 5px;">Auto Registration:</label>
      <select id="gen-register" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--gray-500); background: var(--body-background); color: var(--body-font-color);">
        <option value="true">Allowed (true)</option>
        <option value="false">Disabled (false)</option>
      </select>
    </div>
  </div>

  <div style="margin-top: 15px;">
    <h4 style="margin-bottom: 5px;">Generated <code>docker-compose.yml</code>:</h4>
    <pre style="position: relative;"><code id="output-compose"></code></pre>
  </div>

  <div style="margin-top: 15px;">
    <h4 style="margin-bottom: 5px;">Generated <code>docker run</code> Command:</h4>
    <pre style="position: relative;"><code id="output-run"></code></pre>
  </div>
</div>

<script>
(function() {
  function updateGenerator() {
    var regEl = document.getElementById('gen-registry');
    var portEl = document.getElementById('gen-port');
    var nameEl = document.getElementById('gen-name');
    var regOptEl = document.getElementById('gen-register');
    
    if (!regEl || !portEl || !nameEl || !regOptEl) return;

    var reg = regEl.value;
    var port = portEl.value || '8080';
    var name = nameEl.value || 'podhound';
    var regOpt = regOptEl.value;

    var compose = 'version: \'3.8\'\n\nservices:\n  ' + name + ':\n    image: ' + reg + '\n    container_name: ' + name + '\n    ports:\n      - "' + port + ':8080"\n    environment:\n      - PORT=8080\n      - DATABASE_PATH=/app/data/podhound.db\n      - AUTO_REGISTER=' + regOpt + '\n    volumes:\n      - podhound_data:/app/data\n    restart: unless-stopped\n\nvolumes:\n  podhound_data:';
    
    var run = 'docker run -d \\\n  --name ' + name + ' \\\n  -p ' + port + ':8080 \\\n  -v podhound_data:/app/data \\\n  -e PORT=8080 \\\n  -e DATABASE_PATH=/app/data/podhound.db \\\n  -e AUTO_REGISTER=' + regOpt + ' \\\n  --restart unless-stopped \\\n  ' + reg;

    var outCompose = document.getElementById('output-compose');
    var outRun = document.getElementById('output-run');
    if (outCompose) outCompose.textContent = compose;
    if (outRun) outRun.textContent = run;
  }

  ['gen-registry', 'gen-port', 'gen-name', 'gen-register'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateGenerator);
      el.addEventListener('change', updateGenerator);
    }
  });

  setTimeout(updateGenerator, 100);
})();
</script>

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
