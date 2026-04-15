import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const ensureTables = async () => {
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
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureTables();
  } catch (error) {
    console.error('Error ensuring tables:', error);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  const { fullName, username, phone, email, dob, password, withdrawPin, termsAccepted } = req.body;

  if (!fullName || !username || !phone || !dob || !password || !withdrawPin || termsAccepted === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const age = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  if (age < 18) {
    return res.status(400).json({ error: 'You must be 18 or older' });
  }

  if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return res.status(400).json({ error: 'Password does not meet requirements' });
  }

  if (!/^\d{4}$/.test(withdrawPin)) {
    return res.status(400).json({ error: 'Withdraw PIN must be 4 digits' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const withdrawPinHash = await bcrypt.hash(withdrawPin, 10);

    const query = `
      INSERT INTO users (full_name, username, phone_number, email, date_of_birth, age, password_hash, withdraw_pin_hash, terms_accepted)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, full_name, username, phone_number, email, date_of_birth, age, terms_accepted, created_at
    `;
    const values = [fullName, username, phone, email || null, dob, age, passwordHash, withdrawPinHash, termsAccepted];

    const result = await pool.query(query, values);
    const user = result.rows[0];

    await pool.query(
      `INSERT INTO account_balances (id, user_id, full_name, phone_number, real_balance)
       VALUES ($1, $2, $3, $4, $5)`,
      [crypto.randomUUID(), user.id, fullName, phone, 0]
    );

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Username, phone, or email already exists' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}