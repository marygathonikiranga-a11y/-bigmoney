import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const dbConnectionString = process.env.DATABASE_URL;
if (!dbConnectionString) {
  console.error('Missing DATABASE_URL environment variable for API signup route.');
}

const pool = new Pool({
  connectionString: dbConnectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const isValidEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const getRandomId = () => (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureTables();
  } catch (error) {
    console.error('Error ensuring tables:', error);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }

  const { fullName, username, phone, email, dob, password, withdrawPin, termsAccepted } = req.body;

  if (!fullName?.trim() || !username?.trim() || !phone?.trim() || !dob?.trim() || !password?.trim() || !withdrawPin?.trim() || termsAccepted === undefined) {
    return res.status(400).json({ error: 'Full name, username, phone, date of birth, password, withdraw PIN, and terms acceptance are required.' });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'Email address is invalid.' });
  }

  const age = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  if (Number.isNaN(age)) {
    return res.status(400).json({ error: 'Date of birth is invalid.' });
  }

  if (age < 18) {
    return res.status(400).json({ error: 'You must be 18 or older' });
  }

  if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return res.status(400).json({ error: 'Password does not meet requirements' });
  }

  if (!/^\d{4}$/.test(withdrawPin)) {
    return res.status(400).json({ error: 'Withdraw PIN must be 4 digits' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(password, 10);
    const withdrawPinHash = await bcrypt.hash(withdrawPin, 10);

    const query = `
      INSERT INTO users (full_name, username, phone_number, email, date_of_birth, age, password_hash, withdraw_pin_hash, terms_accepted)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, full_name, username, phone_number, email, date_of_birth, age, terms_accepted, created_at
    `;
    const values = [fullName.trim(), username.trim(), phone.trim(), email?.trim() || null, dob.trim(), age, passwordHash, withdrawPinHash, termsAccepted];

    const result = await client.query(query, values);
    const user = result.rows[0];

    const balanceId = getRandomId();
    await client.query(
      `INSERT INTO account_balances (id, user_id, full_name, phone_number, real_balance)
       VALUES ($1, $2, $3, $4, $5)`,
      [balanceId, user.id, fullName.trim(), phone.trim(), 0]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup API error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username, phone, or email already exists' });
    }
    return res.status(500).json({ error: 'Unable to create account. Please check server logs.' });
  } finally {
    client.release();
  }
}