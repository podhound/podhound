import m001 from "./001_initial_schema.sql" with { type: "text" };

export const migrations = [{ name: "001_initial_schema.sql", sql: m001 }];
