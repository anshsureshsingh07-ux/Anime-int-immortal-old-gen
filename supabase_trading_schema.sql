-- ==========================================
-- SUPABASE RELATIONAL DDL FOR NEXUS TRADING CORE
-- ==========================================
-- This schema establishes the high-availability, secure relational baseline
-- for the Groww-inspired stock market trading engine using 'Nexus Credits' (CR).

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TRADING USERS TABLE
CREATE TABLE IF NOT EXISTS public.trading_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(15),
    credits_balance DECIMAL(18, 4) NOT NULL DEFAULT 100000.0000 CHECK (credits_balance >= 0),
    vcoin_balance DECIMAL(18, 4) NOT NULL DEFAULT 84250.0000 CHECK (vcoin_balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique, case-insensitive index on email as the primary auth identifier
CREATE UNIQUE INDEX IF NOT EXISTS idx_trading_users_email_lower ON public.trading_users(LOWER(email));

-- Unique, case-insensitive index on username for profile purposes
CREATE UNIQUE INDEX IF NOT EXISTS idx_trading_users_username_lower ON public.trading_users(LOWER(username));

-- Index for speedy auth lookups
CREATE INDEX IF NOT EXISTS idx_trading_users_username ON public.trading_users(username);

-- 2. STOCKS SPECIFICATION TABLE
CREATE TABLE IF NOT EXISTS public.trading_stocks (
    symbol VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    current_price DECIMAL(18, 4) NOT NULL CHECK (current_price > 0),
    prev_close DECIMAL(18, 4) NOT NULL CHECK (prev_close > 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Prepopulate trading stock assets
INSERT INTO public.trading_stocks (symbol, name, sector, current_price, prev_close)
VALUES 
('VNG', 'Vanguard CyberTech Corp', 'Technology', 340.50, 335.20),
('SHND', 'Shindo Robotics Allied', 'Industrial Automation', 185.25, 189.90),
('KRP', 'Capsule Synergy Corp', 'Aeronautics & Research', 612.40, 595.00),
('SND', 'Shinra Mako Utilities', 'Energy infrastructure', 84.75, 84.00),
('NEX', 'Nexus Quantum Systems', 'Quantum Computing', 1210.00, 1180.50),
('ANM', 'AnimeInt Global Media', 'Entertainment & VR', 45.10, 43.80)
ON CONFLICT (symbol) DO NOTHING;

-- 3. PORTFOLIOS TABLE (HOLDINGS PER USER)
CREATE TABLE IF NOT EXISTS public.trading_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.trading_users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL REFERENCES public.trading_stocks(symbol) ON DELETE RESTRICT,
    shares INT NOT NULL CHECK (shares >= 0),
    average_price DECIMAL(18, 4) NOT NULL CHECK (average_price >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, stock_symbol)
);

CREATE INDEX IF NOT EXISTS idx_trading_portfolios_user ON public.trading_portfolios(user_id);

-- 4. ORDERS LEDGER TABLE (BUY/SELL MATCHING QUEUE)
CREATE TABLE IF NOT EXISTS public.trading_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.trading_users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL REFERENCES public.trading_stocks(symbol) ON DELETE RESTRICT,
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('BUY', 'SELL')),
    order_class VARCHAR(10) NOT NULL CHECK (order_class IN ('MARKET', 'LIMIT')),
    shares INT NOT NULL CHECK (shares > 0),
    limit_price DECIMAL(18, 4) CHECK (limit_price >= 0), -- null for market orders
    executed_price DECIMAL(18, 4),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    total_credits DECIMAL(18, 4) NOT NULL CHECK (total_credits >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trading_orders_user ON public.trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON public.trading_orders(stock_symbol);

-- 5. CREDITS LEDGER (DOUBLE-ENTRY FINANCIAL AUDIT PATH)
CREATE TABLE IF NOT EXISTS public.trading_credits_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.trading_users(id) ON DELETE CASCADE,
    tx_type VARCHAR(20) NOT NULL CHECK (tx_type IN ('BUY_STOCK', 'SELL_STOCK', 'DEPOSIT', 'ADMIN_ADJUST', 'CONVERSION')),
    amount_cr DECIMAL(18, 4) NOT NULL, -- positive for credits inflow, negative for outbound transactions
    exchange_rate DECIMAL(18, 4) NOT NULL DEFAULT 1.0000, -- e.g. amount of Nexus Credits (CR) per V-COIN
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credits_ledger_user ON public.trading_credits_ledger(user_id);

-- ==================================================
-- TRANSACTION BALANCING SYSTEMS AND TRIGGER PROCEDURES
-- ==================================================

-- Trigger to keep updated_at synchronous across state adjustments
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trading_users_modtime BEFORE UPDATE ON public.trading_users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_trading_stocks_modtime BEFORE UPDATE ON public.trading_stocks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_trading_portfolios_modtime BEFORE UPDATE ON public.trading_portfolios FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable Row-Level Security (RLS) for high safety constraints
ALTER TABLE public.trading_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_credits_ledger ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies mapped to authentic Auth state tokens
CREATE POLICY "Users can only view their own balance profile"
    ON public.trading_users FOR ALL
    USING (auth.uid() = id);

CREATE POLICY "Users can edit and inspect their own stock portfolio"
    ON public.trading_portfolios FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can track their own trading orders"
    ON public.trading_orders FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view audit tracking on their ledger list"
    ON public.trading_credits_ledger FOR ALL
    USING (auth.uid() = user_id);
