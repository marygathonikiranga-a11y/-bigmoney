import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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