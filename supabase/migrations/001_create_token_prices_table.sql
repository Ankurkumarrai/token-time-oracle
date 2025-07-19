-- Create token_prices table for caching historical price data
CREATE TABLE IF NOT EXISTS token_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT NOT NULL,
    network TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_token_prices_token_network ON token_prices(token_address, network);
CREATE INDEX IF NOT EXISTS idx_token_prices_timestamp ON token_prices(timestamp);
CREATE INDEX IF NOT EXISTS idx_token_prices_date ON token_prices(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_prices_unique ON token_prices(token_address, network, date);

-- Create price_fetch_jobs table for tracking scheduled fetching jobs
CREATE TABLE IF NOT EXISTS price_fetch_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id TEXT UNIQUE NOT NULL,
    token_address TEXT NOT NULL,
    network TEXT NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 0,
    completed_days INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error')),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for job tracking
CREATE INDEX IF NOT EXISTS idx_price_fetch_jobs_job_id ON price_fetch_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_price_fetch_jobs_status ON price_fetch_jobs(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_token_prices_updated_at 
    BEFORE UPDATE ON token_prices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_fetch_jobs_updated_at 
    BEFORE UPDATE ON price_fetch_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE token_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_fetch_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access on token_prices" ON token_prices
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on token_prices" ON token_prices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on price_fetch_jobs" ON price_fetch_jobs
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on price_fetch_jobs" ON price_fetch_jobs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on price_fetch_jobs" ON price_fetch_jobs
    FOR UPDATE USING (true);