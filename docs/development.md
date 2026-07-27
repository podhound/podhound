# Developer Guide

## Prerequisites
* [Bun](https://bun.sh) installed (v1.x or newer).

## Steps to Run

1. **Clone the repository and navigate into the directory:**
   ```bash
   git clone https://github.com/svyatoslav-kubakh/podhound.git
   cd podhound
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Start the server in development mode (with hot-reloading):**
   ```bash
   bun start:dev
   ```
   The server will start listening at `http://localhost:8080`.

4. **Run automated test suite:**
   ```bash
   bun test
   ```

5. **Lint and auto-fix code style:**
   ```bash
   bun run lint      # check only
   bun run lint:fix   # auto-fix
   ```

6. **Build a standalone executable binary:**
   ```bash
   bun run build
   ./dist/podhound
   ```

## Project Structure

```
src/
├── config/          # App configuration (env variables)
├── db/              # Database client, migrations
│   └── migrations/  # SQL migration files
├── routes/          # HTTP and CLI routing
│   ├── api/         # API sub-routers (auth, devices, subscriptions, episodes)
│   └── cli/         # CLI sub-routers (user management)
├── services/        # Business logic (auth, users, subscriptions, episodes)
├── types/           # Shared TypeScript interfaces
└── main.ts          # Application entry point
```

> [!NOTE]
> For a full list of available settings, please refer to the **[Environment Variables](environment.md)** documentation.
