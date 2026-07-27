import { Database } from "bun:sqlite";

export interface User {
  id: number;
  username: string;
  password_hash: string;
}

export class AuthService {
  constructor(private db: Database) {}

  public getOrCreateUser(username: string, password?: string): User | null {
    const user = this.db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | null;

    if (!user) {
      if (!password) return null; // Cannot create without password
      const password_hash = Bun.password.hashSync(password);
      const result = this.db
        .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
        .run(username, password_hash);
      return {
        id: Number(result.lastInsertRowid),
        username,
        password_hash,
      };
    }

    if (password) {
      const isValid = Bun.password.verifySync(password, user.password_hash);
      if (!isValid) return null;
    }

    return user;
  }
}
