import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const ensureTables = async () => {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      phone_number TEXT NOT NULL UNIQUE,
      email TEXT,
      date_of_birth DATE NOT NULL,
      age INTEGER NOT NULL,
      password_hash TEXT NOT NULL,
      withdraw_pin_hash TEXT NOT NULL,
      terms_accepted BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_balances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      real_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
      name TEXT,
      phone_number TEXT,
      amount NUMERIC(18,2) NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved')) DEFAULT 'pending',
      processed BOOLEAN NOT NULL DEFAULT false,
      reference TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT false;
  `);
};

const applyApprovedTransactionsForUser = async (userId) => {
  const approvedRes = await pool.query(
    `SELECT id, type, amount
     FROM transactions
     WHERE user_id = $1 AND status = 'approved' AND processed = false`,
    [userId]
  );

  if (approvedRes.rowCount === 0) return;

  let balanceChange = 0;
  approvedRes.rows.forEach((tx) => {
    balanceChange += tx.type === 'deposit' ? parseFloat(tx.amount) : -parseFloat(tx.amount);
  });

  await pool.query(
    'UPDATE account_balances SET real_balance = real_balance + $1, updated_at = now() WHERE user_id = $2',
    [balanceChange, userId]
  );

  await pool.query(
    `UPDATE transactions
     SET processed = true, updated_at = now()
     WHERE user_id = $1 AND status = 'approved' AND processed = false`,
    [userId]
  );
};

export default async function handler(req, res) {
  // Set CORS headers for production domain
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://tradex-bigmoney1.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureTables();
  } catch (error) {
    console.error('Error ensuring tables:', error);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  const { username } = req.query;

  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.phone_number, u.email, u.date_of_birth, u.age
       FROM users u
       WHERE u.username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    await applyApprovedTransactionsForUser(user.id);

    const balanceResult = await pool.query(
      'SELECT real_balance FROM account_balances WHERE user_id = $1',
      [user.id]
    );

    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        phone: user.phone_number,
        dateOfBirth: user.date_of_birth,
        age: user.age,
        realBalance: parseFloat(balanceResult.rows?.[0]?.real_balance || '0'),
        demoBalance: 100000,
        accountType: 'demo',
        withdrawPin: '',
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}