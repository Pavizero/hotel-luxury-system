import mysql from "mysql2/promise"

const { DATABASE_URL } = process.env

const isPlaceholder =
  !DATABASE_URL ||
  DATABASE_URL === "your_database_url_here" ||
  DATABASE_URL.startsWith("postgres://") ||
  DATABASE_URL.startsWith("postgresql://")

if (isPlaceholder) {
  throw new Error(
    [
      "❌  DATABASE_URL is missing or invalid.",
      "",
      "Add a valid MySQL connection string in `.env.local`, e.g.:",
      "DATABASE_URL=mysql://user:password@localhost:3306/hotel_luxury",
      "",
      "If using XAMPP, default user is 'root' and password is usually empty.",
      "",
      "DATABASE_URL=mysql://root:@localhost:3306/hotel_luxury",
    ].join("\n"),
  )
}

const pool = mysql.createPool(DATABASE_URL)

/**
 * Tagged template for parameterized queries.
 * Only use interpolation for data values, NOT for table/column names!
 */
export async function sql<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  let query = ''
  for (let i = 0; i < strings.length; i++) {
    query += strings[i]
    if (i < values.length) query += '?'
  }

  if (!query.trim() || /^[a-zA-Z0-9_]+$/.test(query.trim())) {
    throw new Error(
      [
        "❌  Invalid SQL statement.",
        "",
        "It looks like you're trying to run a query that's just a table name or empty.",
        "Make sure you're passing a complete SQL statement, e.g.:",
        "  await sql`SELECT * FROM users`",
        "",
        "If you need to interpolate table/column names, do so manually (not parameterized), and sanitize carefully."
      ].join("\n"),
    )
  }

  const [rows] = await pool.query(query, values)
  return rows as T[]
}

/**
 * Raw query function for DDL or dynamic queries (optionally parameterized).
 * Use for CREATE TABLE, DROP TABLE, or dynamic identifiers.
 * Usage: await sql.raw("CREATE TABLE ...");
 * Usage: await sql.raw("SELECT * FROM ?? WHERE id = ?", [tableName, id])
 */
sql.raw = async function<T = unknown>(query: string, values?: unknown[]): Promise<T[]> {
  const [rows] = await pool.query(query, values)
  return rows as T[]
}

/**
 * Escapes identifiers (table/column names) for use in raw queries.
 * Usage: sql.raw(`SELECT * FROM ${escapeId(tableName)}`)
 */
export function escapeId(name: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error("Invalid identifier")
  return `\`${name}\``
}

// Export pool for advanced use cases if needed
export { pool }