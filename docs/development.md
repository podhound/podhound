# Developer Mode Deployment

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
   bun run dev
   ```
   The server will start listening at `http://localhost:8080`.

4. **Run automated test suite:**
   ```bash
   bun test
   ```

5. **Build a standalone executable binary:**
   ```bash
   bun run build
   ./dist/podhound
   ```

> [!NOTE]
> For a full list of available settings, please refer to the **[Environment Variables](environment.md)** documentation.
