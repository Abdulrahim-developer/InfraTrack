import 'dotenv/config'
import pg from 'pg'
import argon2 from 'argon2'
import { randomBytes } from 'node:crypto'

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from your .env file')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const accounts = [
  {
    fullName: 'Asset Manager',
    email: 'asset.manager@infratrack.local',
    roleName: 'ASSET_MANAGER',
  },
  {
    fullName: 'Viewer Auditor',
    email: 'viewer.auditor@infratrack.local',
    roleName: 'VIEWER_AUDITOR',
  },
]

async function seedAccounts() {
  const client = await pool.connect()
  const createdCredentials = []

  try {
    await client.query('BEGIN')

    const rolesResult = await client.query(
      `SELECT role_id, role_name
       FROM roles
       WHERE role_name IN ($1, $2)`,
      ['ASSET_MANAGER', 'VIEWER_AUDITOR'],
    )

    const roleMap = new Map(
      rolesResult.rows.map((role) => [role.role_name, role.role_id]),
    )

    for (const account of accounts) {
      if (!roleMap.has(account.roleName)) {
        throw new Error(`Role not found in database: ${account.roleName}`)
      }

      const existingUser = await client.query(
        `SELECT user_id FROM users WHERE lower(email) = lower($1)`,
        [account.email],
      )

      if (existingUser.rowCount > 0) {
        throw new Error(
          `Account already exists: ${account.email}. No accounts were created.`,
        )
      }
    }

    for (const account of accounts) {
      const password = randomBytes(18).toString('base64url')

      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
      })

      const userResult = await client.query(
        `INSERT INTO users (
          full_name,
          email,
          password_hash,
          email_verified_at,
          account_status
        )
        VALUES ($1, $2, $3, NOW(), 'ACTIVE')
        RETURNING user_id`,
        [account.fullName, account.email, passwordHash],
      )

      const userId = userResult.rows[0].user_id
      const roleId = roleMap.get(account.roleName)

      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)`,
        [userId, roleId],
      )

      createdCredentials.push({
        name: account.fullName,
        email: account.email,
        password,
        role: account.roleName,
      })
    }

    await client.query('COMMIT')

    console.log('\nLocal test accounts created successfully.\n')

    for (const account of createdCredentials) {
      console.log('-----------------------------------')
      console.log(`Name:     ${account.name}`)
      console.log(`Email:    ${account.email}`)
      console.log(`Password: ${account.password}`)
      console.log(`Role:     ${account.role}`)
    }

    console.log('-----------------------------------')
    console.log('\nSave these passwords securely. They will not be displayed again.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seedAccounts().catch((error) => {
  console.error('\nAccount creation failed:', error.message)
  process.exitCode = 1
})
