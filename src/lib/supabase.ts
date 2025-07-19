import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      token_prices: {
        Row: {
          id: string
          token_address: string
          network: string
          timestamp: number
          price: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token_address: string
          network: string
          timestamp: number
          price: number
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token_address?: string
          network?: string
          timestamp?: number
          price?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      price_fetch_jobs: {
        Row: {
          id: string
          job_id: string
          token_address: string
          network: string
          total_days: number
          completed_days: number
          status: 'pending' | 'running' | 'completed' | 'error'
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          token_address: string
          network: string
          total_days?: number
          completed_days?: number
          status?: 'pending' | 'running' | 'completed' | 'error'
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          token_address?: string
          network?: string
          total_days?: number
          completed_days?: number
          status?: 'pending' | 'running' | 'completed' | 'error'
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}