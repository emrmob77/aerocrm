export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          plan: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: string
          team_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: string
          team_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: string
          team_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          company: string | null
          position: string | null
          address: string | null
          custom_fields: Json
          user_id: string
          team_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          position?: string | null
          address?: string | null
          custom_fields?: Json
          user_id: string
          team_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          position?: string | null
          address?: string | null
          custom_fields?: Json
          user_id?: string
          team_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          currency: string
          category: string | null
          active: boolean
          team_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          currency?: string
          category?: string | null
          active?: boolean
          team_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          currency?: string
          category?: string | null
          active?: boolean
          team_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          title: string
          value: number
          currency: string
          stage: string
          contact_id: string
          user_id: string
          team_id: string
          expected_close_date: string | null
          probability: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          value: number
          currency?: string
          stage?: string
          contact_id: string
          user_id: string
          team_id: string
          expected_close_date?: string | null
          probability?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          value?: number
          currency?: string
          stage?: string
          contact_id?: string
          user_id?: string
          team_id?: string
          expected_close_date?: string | null
          probability?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deal_products: {
        Row: {
          id: string
          deal_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          product_id: string
          quantity?: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          title: string
          deal_id: string | null
          contact_id: string
          user_id: string
          team_id: string
          blocks: Json
          status: string
          public_url: string | null
          expires_at: string | null
          signed_at: string | null
          signature_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          deal_id?: string | null
          contact_id: string
          user_id: string
          team_id: string
          blocks?: Json
          status?: string
          public_url?: string | null
          expires_at?: string | null
          signed_at?: string | null
          signature_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          deal_id?: string | null
          contact_id?: string
          user_id?: string
          team_id?: string
          blocks?: Json
          status?: string
          public_url?: string | null
          expires_at?: string | null
          signed_at?: string | null
          signature_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      proposal_views: {
        Row: {
          id: string
          proposal_id: string
          ip_address: string | null
          user_agent: string | null
          duration_seconds: number | null
          blocks_viewed: Json
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          ip_address?: string | null
          user_agent?: string | null
          duration_seconds?: number | null
          blocks_viewed?: Json
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          ip_address?: string | null
          user_agent?: string | null
          duration_seconds?: number | null
          blocks_viewed?: Json
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          blocks: Json
          category: string | null
          is_public: boolean
          usage_count: number
          user_id: string
          team_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          blocks?: Json
          category?: string | null
          is_public?: boolean
          usage_count?: number
          user_id: string
          team_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          blocks?: Json
          category?: string | null
          is_public?: boolean
          usage_count?: number
          user_id?: string
          team_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          url: string
          secret_key: string
          events: string[]
          active: boolean
          last_triggered_at: string | null
          success_count: number
          failure_count: number
          team_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          secret_key: string
          events: string[]
          active?: boolean
          last_triggered_at?: string | null
          success_count?: number
          failure_count?: number
          team_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          secret_key?: string
          events?: string[]
          active?: boolean
          last_triggered_at?: string | null
          success_count?: number
          failure_count?: number
          team_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          action_url: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean
          action_url?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          action_url?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          type: string
          title: string
          description: string | null
          user_id: string
          team_id: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          description?: string | null
          user_id: string
          team_id: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          description?: string | null
          user_id?: string
          team_id?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          open_deals: number
          monthly_revenue: number
          conversion_rate: number
          pipeline_value: number
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
