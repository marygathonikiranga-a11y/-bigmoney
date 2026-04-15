-- Create a dedicated account balances table for real balance updates.
-- This table stores the latest real balance for each user.

CREATE TABLE IF NOT EXISTS account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  real_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  name TEXT,
  phone_number TEXT,
  amount NUMERIC(18,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved')) DEFAULT 'pending',
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
