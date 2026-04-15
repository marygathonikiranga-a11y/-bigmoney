import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const main = async () => {
  try {
    const res = await pool.query("select table_name from information_schema.tables where table_name = 'users' and table_schema = 'public'");
    console.log('table rows:', res.rows);
  } catch (err) {
    console.error('error', err);
  } finally {
    await pool.end();
  }
};

main();
