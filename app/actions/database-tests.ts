"use server"

import { sql, escapeId } from "@/lib/db"
import { randomUUID } from "crypto"

interface ConnectedResult {
  connected: number;
}

interface TestTableRow {
  id: string;
  value: string;
  created_at: string;
}

interface DatabaseInfoRow {
  database_name: string;
  database_size_mb: number;
}

interface TableInfoRow {
  table_name: string;
  table_size_mb: number;
}

interface VersionInfoRow {
  version: string;
}

export async function runNetworkTest() {
  try {
    console.log("Running network test...")
    const result = await sql<ConnectedResult>`SELECT 1 as connected;`
    console.log("Network test result:", result)
    if (result && result.length > 0 && result[0].connected === 1) {
      return { success: true, message: "Successfully connected to the database." }
    }
    return { success: false, message: "Failed to connect to the database." }
  } catch (error: unknown) {
    console.error("Network test failed:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, message: `Network test failed: ${errorMessage}` }
  }
}

export async function runFullTest() {
  const testTableName = "v0_test_table"
  const testId = randomUUID()
  const testValue = `test_value_${Date.now()}`
  const results: string[] = []
  const tableSql = escapeId(testTableName)

  try {
    console.log("Running full database test...")

    // 1. Create table (if not exists)
    await sql.raw(
      `CREATE TABLE IF NOT EXISTS ${tableSql} (
        id CHAR(36) PRIMARY KEY,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    )
    results.push("Table creation/check: Success")

    // 2. Insert
    await sql.raw(`INSERT INTO ${tableSql} (id, value) VALUES (?, ?)`, [testId, testValue])
    results.push(`Insert operation: Success (ID: ${testId})`)

    // 3. Select
    const selectResult = await sql.raw<TestTableRow>(`SELECT * FROM ${tableSql} WHERE id = ?`, [testId])
    if (selectResult.length > 0 && selectResult[0].value === testValue) {
      results.push(`Select operation: Success (Found value: ${selectResult[0].value})`)
    } else {
      results.push("Select operation: Failed (Value not found or mismatched)")
      throw new Error("Select failed")
    }

    // 4. Update
    const updatedValue = `${testValue}_updated`
    await sql.raw(`UPDATE ${tableSql} SET value = ? WHERE id = ?`, [updatedValue, testId])
    results.push(`Update operation: Success (New value: ${updatedValue})`)

    const verifyUpdate = await sql.raw<TestTableRow>(`SELECT * FROM ${tableSql} WHERE id = ?`, [testId])
    if (verifyUpdate.length > 0 && verifyUpdate[0].value === updatedValue) {
      results.push("Update verification: Success")
    } else {
      results.push("Update verification: Failed")
      throw new Error("Update verification failed")
    }

    // 5. Delete
    await sql.raw(`DELETE FROM ${tableSql} WHERE id = ?`, [testId])
    results.push("Delete operation: Success")

    const verifyDelete = await sql.raw<TestTableRow>(`SELECT * FROM ${tableSql} WHERE id = ?`, [testId])
    if (verifyDelete.length === 0) {
      results.push("Delete verification: Success")
    } else {
      results.push("Delete verification: Failed (Record still exists)")
      throw new Error("Delete verification failed")
    }

    return { success: true, message: "Full database test completed successfully.", details: results }
  } catch (error: unknown) {
    console.error("Full database test failed:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.push(`Full test failed: ${errorMessage}`)
    return { success: false, message: `Full database test failed: ${errorMessage}`, details: results }
  } finally {
    // Optionally clean up test table:
    // await sql.raw(`DROP TABLE IF EXISTS ${tableSql}`);
    // results.push('Test table cleanup: Done');
  }
}

export async function getDatabaseInfo() {
  try {
    console.log("Fetching database info...")

    // Database size for MySQL/MariaDB
    const dbInfo = await sql<DatabaseInfoRow>`
      SELECT
        table_schema AS database_name,
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS database_size_mb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      GROUP BY table_schema;
    `

    // Table sizes for MySQL/MariaDB
    const tableInfo = await sql<TableInfoRow>`
      SELECT
        table_name,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS table_size_mb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY table_name;
    `

    const versionInfo = await sql<VersionInfoRow>`SELECT VERSION() AS version;`

    return {
      success: true,
      message: "Database information retrieved successfully.",
      data: {
        database: dbInfo[0] || {},
        tables: tableInfo || [],
        version: versionInfo[0]?.version || "N/A",
      },
    }
  } catch (error: unknown) {
    console.error("Failed to get database info:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, message: `Failed to get database info: ${errorMessage}` }
  }
}

export async function getDebugInfo() {
  const safeEnvVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + "...",
  }

  return {
    success: true,
    message: "Debug information retrieved.",
    data: {
      timestamp: new Date().toISOString(),
      environment: safeEnvVars,
    },
  }
}