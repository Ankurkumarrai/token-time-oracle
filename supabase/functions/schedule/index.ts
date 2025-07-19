import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduleRequest {
  token: string;
  network: string;
}

interface ScheduleResponse {
  job_id: string;
  message: string;
  estimated_days: number;
}

// Function to detect token birthdate (simplified mock)
async function getTokenBirthdate(tokenAddress: string, network: string): Promise<number> {
  // In real implementation, this would call Alchemy to get first transaction
  // For now, return a mock date (1 year ago)
  const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
  return Math.floor(oneYearAgo / 1000);
}

// Function to generate daily timestamps from creation to now
function generateDailyTimestamps(startTimestamp: number): number[] {
  const timestamps: number[] = [];
  const now = Math.floor(Date.now() / 1000);
  const oneDaySeconds = 24 * 60 * 60;
  
  for (let ts = startTimestamp; ts <= now; ts += oneDaySeconds) {
    timestamps.push(ts);
  }
  
  return timestamps;
}

// Mock function to fetch price from Alchemy for a specific timestamp
async function fetchPriceFromAlchemy(tokenAddress: string, network: string, timestamp: number): Promise<number> {
  // Mock implementation - in reality would call Alchemy's historical price API
  // Adding some realistic price variation
  const basePrice = 1.0;
  const variation = Math.sin(timestamp / 86400) * 0.1; // Daily variation
  const randomNoise = (Math.random() - 0.5) * 0.02; // Small random noise
  
  return Math.max(0.01, basePrice + variation + randomNoise);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { token, network }: ScheduleRequest = await req.json()

    if (!token || !network) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, network' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if we already have data for this token
    const { data: existingData } = await supabase
      .from('token_prices')
      .select('date')
      .eq('token_address', token.toLowerCase())
      .eq('network', network)
      .order('date', { ascending: false })
      .limit(1)

    let startTimestamp: number;
    
    if (existingData && existingData.length > 0) {
      // Resume from last known date
      const lastDate = new Date(existingData[0].date);
      startTimestamp = Math.floor(lastDate.getTime() / 1000) + 86400; // Next day
    } else {
      // Start from token creation
      startTimestamp = await getTokenBirthdate(token, network);
    }

    const dailyTimestamps = generateDailyTimestamps(startTimestamp);
    
    if (dailyTimestamps.length === 0) {
      return new Response(
        JSON.stringify({
          job_id: `no-work-${Date.now()}`,
          message: 'All historical data already cached',
          estimated_days: 0
        } as ScheduleResponse),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a job record
    const jobId = `job-${token.slice(0, 8)}-${Date.now()}`;
    
    await supabase
      .from('price_fetch_jobs')
      .insert({
        job_id: jobId,
        token_address: token.toLowerCase(),
        network,
        total_days: dailyTimestamps.length,
        completed_days: 0,
        status: 'running',
        started_at: new Date().toISOString()
      })

    // Start background processing (in chunks to respect rate limits)
    const chunkSize = 10; // Process 10 days at a time
    const chunks = [];
    
    for (let i = 0; i < dailyTimestamps.length; i += chunkSize) {
      chunks.push(dailyTimestamps.slice(i, i + chunkSize));
    }

    // Process chunks with delays (simulate rate limiting)
    setTimeout(async () => {
      try {
        let completedDays = 0;
        
        for (const chunk of chunks) {
          const pricePromises = chunk.map(async (timestamp) => {
            const price = await fetchPriceFromAlchemy(token, network, timestamp);
            const date = new Date(timestamp * 1000).toISOString().split('T')[0];
            
            return {
              token_address: token.toLowerCase(),
              network,
              timestamp,
              price,
              date
            };
          });

          const prices = await Promise.all(pricePromises);
          
          // Insert batch of prices
          await supabase
            .from('token_prices')
            .insert(prices);

          completedDays += chunk.length;

          // Update job progress
          await supabase
            .from('price_fetch_jobs')
            .update({
              completed_days: completedDays,
              status: completedDays >= dailyTimestamps.length ? 'completed' : 'running',
              updated_at: new Date().toISOString()
            })
            .eq('job_id', jobId);

          // Delay between chunks to respect rate limits
          if (chunks.indexOf(chunk) < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }
        }

        console.log(`Job ${jobId} completed successfully`);
        
      } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        
        await supabase
          .from('price_fetch_jobs')
          .update({
            status: 'error',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('job_id', jobId);
      }
    }, 1000); // Start processing after 1 second

    return new Response(
      JSON.stringify({
        job_id: jobId,
        message: 'Historical price fetch scheduled successfully',
        estimated_days: dailyTimestamps.length
      } as ScheduleResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in schedule function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})