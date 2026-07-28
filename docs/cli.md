# Command Line Interface (CLI)

Podhound provides a CLI for server management.

## Usage

```bash
# Via Bun (development)
bun run src/main.ts <domain> <action> [args...]

# Via compiled binary
./dist/podhound <domain> <action> [args...]
```

## User Management

### List all users

```bash
# Via Bun (development)
bun run src/main.ts users list

# Via compiled binary
./dist/podhound users list
```
Displays a table of all registered users.

### Create a new user

```bash
# Via Bun (development)
bun run src/main.ts users create <username> <password>

# Via compiled binary
./dist/podhound users create <username> <password>
```
Manually creates a new user account.

### Update a user's password

```bash
# Via Bun (development)
bun run src/main.ts users update <username> <new_password>

# Via compiled binary
./dist/podhound users update <username> <new_password>
```
Updates the password for an existing user account.
