# Command Line Interface (CLI)

Podhound provides a CLI for server management.

You can invoke the CLI by passing arguments to the Podhound executable or via `bun run src/index.ts`.

## Usage

```bash
bun run src/index.ts <domain> <action> [args...]
```

## User Management

### List all users

```bash
bun run src/index.ts users list
```
Displays a table of all registered users.

### Create a new user

```bash
bun run src/index.ts users create <username> <password>
```
Manually creates a new user account.

### Update a user's password

```bash
bun run src/index.ts users update <username> <new_password>
```
Updates the password for an existing user account.
