import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

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

  await pool.query(`
    ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT false;
  `);
};

app.post('/api/signup', async (req, res) => {
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
    if (error.code === '23505') { // unique violation
      res.status(409).json({ error: 'Username, phone, or email already exists' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, full_name, username, phone_number, email, date_of_birth, age, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

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
});

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

app.get('/api/user/:userId/transactions', async (req, res) => {
  const { userId } = req.params;
  try {
    await applyApprovedTransactionsForUser(userId);

    const result = await pool.query(
      `SELECT id, type, amount, status, reference, created_at, updated_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.status(200).json({ transactions: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/:username', async (req, res) => {
  const { username } = req.params;
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
});

app.post('/api/deposit', async (req, res) => {
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
});

app.post('/api/withdraw', async (req, res) => {
  const { userId, amount, pin } = req.body;

  if (!userId || !amount || amount <= 0 || !pin) {
    return res.status(400).json({ error: 'Invalid withdrawal request' });
  }

  try {
    const userResult = await pool.query('SELECT full_name, phone_number, withdraw_pin_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const validPin = await bcrypt.compare(pin, user.withdraw_pin_hash);
    if (!validPin) {
      return res.status(401).json({ error: 'Invalid withdraw PIN' });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, name, phone_number, amount, status, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, type, amount, status, reference, created_at`,
      [userId, 'withdraw', user.full_name, user.phone_number, amount, 'pending', null]
    );

    res.status(201).json({ transaction: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transaction/:transactionId', async (req, res) => {
  const { transactionId } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, user_id, type, amount, status, processed, reference, created_at, updated_at FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];
    if (transaction.status === 'approved' && !transaction.processed) {
      await applyApprovedTransactionsForUser(transaction.user_id);
      const updatedResult = await pool.query(
        'SELECT id, user_id, type, amount, status, processed, reference, created_at, updated_at FROM transactions WHERE id = $1',
        [transactionId]
      );
      return res.status(200).json({ transaction: updatedResult.rows[0] });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/mpesa-callback', async (req, res) => {
  const { transactionId, status } = req.body;

  const validStatuses = ['pending', 'approved', 'success'];
  if (!transactionId || !status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid callback payload' });
  }

  try {
    const transResult = await pool.query('SELECT user_id, type, amount, status FROM transactions WHERE id = $1', [transactionId]);
    if (transResult.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transResult.rows[0];
    const updatedAt = new Date();
    const newStatus = status === 'success' ? 'approved' : status;

    await pool.query('UPDATE transactions SET status = $1, updated_at = $2 WHERE id = $3', [newStatus, updatedAt, transactionId]);

    if (newStatus === 'approved') {
      await applyApprovedTransactionsForUser(transaction.user_id);
    }

    res.status(200).json({ message: 'Callback handled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

(async () => {
  await ensureTables();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();