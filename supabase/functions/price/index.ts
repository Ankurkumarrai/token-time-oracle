import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PriceRequest {
  token: string;
  network: string;
  timestamp: number;
}

interface PriceResponse {
  price: number;
  source: "cache" | "alchemy" | "interpolated";
}

interface CachedPrice {
  id: string;
  token_address: string;
  network: string;
  timestamp: number;
  price: number;
  date: string;
  created_at: string;
}

// Interpolation function
function interpolatePrice(
  targetTimestamp: number,
  beforeTimestamp: number,
  beforePrice: number,
  afterTimestamp: number,
  afterPrice: number
): number {
  const ratio = (targetTimestamp - beforeTimestamp) / (afterTimestamp - beforeTimestamp);
  return beforePrice + (afterPrice - beforePrice) * ratio;
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

    const { token, network, timestamp }: PriceRequest = await req.json()

    if (!token || !network || !timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, network, timestamp' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // First, check cache for exact timestamp (within 1 hour tolerance)
    const tolerance = 3600; // 1 hour in seconds
    const { data: exactMatch } = await supabase
      .from('token_prices')
      .select('*')
      .eq('token_address', token.toLowerCase())
      .eq('network', network)
      .gte('timestamp', timestamp - tolerance)
      .lte('timestamp', timestamp + tolerance)
      .order('timestamp', { ascending: true })
      .limit(1)

    if (exactMatch && exactMatch.length > 0) {
      const cachedPrice = exactMatch[0] as CachedPrice;
      return new Response(
        JSON.stringify({
          price: cachedPrice.price,
          source: "cache"
        } as PriceResponse),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If no exact match, look for prices before and after for interpolation
    const { data: beforePrices } = await supabase
      .from('token_prices')
      .select('*')
      .eq('token_address', token.toLowerCase())
      .eq('network', network)
      .lt('timestamp', timestamp)
      .order('timestamp', { ascending: false })
      .limit(1)

    const { data: afterPrices } = await supabase
      .from('token_prices')
      .select('*')
      .eq('token_address', token.toLowerCase())
      .eq('network', network)
      .gt('timestamp', timestamp)
      .order('timestamp', { ascending: true })
      .limit(1)

    if (beforePrices && beforePrices.length > 0 && afterPrices && afterPrices.length > 0) {
      const beforePrice = beforePrices[0] as CachedPrice;
      const afterPrice = afterPrices[0] as CachedPrice;
      
      const interpolatedPrice = interpolatePrice(
        timestamp,
        beforePrice.timestamp,
        beforePrice.price,
        afterPrice.timestamp,
        afterPrice.price
      );

      return new Response(
        JSON.stringify({
          price: parseFloat(interpolatedPrice.toFixed(8)),
          source: "interpolated"
        } as PriceResponse),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If no cache data available, fetch from Alchemy
    const alchemyApiKey = Deno.env.get('ALCHEMY_API_KEY')
    if (!alchemyApiKey) {
      return new Response(
        JSON.stringify({ error: 'Alchemy API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Simulate Alchemy API call (replace with actual implementation)
    const mockPrice = 1.0 + Math.random() * 0.1; // Mock price between 1.0 and 1.1
    
    // Store in cache for future use
    const targetDate = new Date(timestamp * 1000).toISOString().split('T')[0];
    
    await supabase
      .from('token_prices')
      .insert({
        token_address: token.toLowerCase(),
        network,
        timestamp,
        price: mockPrice,
        date: targetDate
      })

    return new Response(
      JSON.stringify({
        price: parseFloat(mockPrice.toFixed(8)),
        source: "alchemy"
      } as PriceResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in price function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})