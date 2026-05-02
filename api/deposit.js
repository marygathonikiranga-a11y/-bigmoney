import { Pool } from 'pg';
import crypto from 'crypto';

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

  const { userId, amount } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const userResult = await pool.query('SELECT full_name, phone_number FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, name, phone_number, amount, status, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, type, amount, status, reference, created_at`,
      [userId, 'deposit', user.full_name, user.phone_number, amount, 'pending', null]
    );

    res.status(201).json({ transaction: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}