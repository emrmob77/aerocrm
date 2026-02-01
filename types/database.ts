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
        Relationships: []
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
        Relationships: []
      }
      team_invites: {
        Row: {
          id: string
          team_id: string
          email: string
          role: string
          invited_by: string | null
          token: string
          status: string
          expires_at: string | null
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          email: string
          role?: string
          invited_by?: string | null
          token: string
          status?: string
          expires_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          email?: string
          role?: string
          invited_by?: string | null
          token?: string
          status?: string
          expires_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      webhook_logs: {
        Row: {
          id: string
          webhook_id: string
          event_type: string
          payload: Json
          response_status: number | null
          response_body: string | null
          success: boolean
          error_message: string | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          webhook_id: string
          event_type: string
          payload?: Json
          response_status?: number | null
          response_body?: string | null
          success?: boolean
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          webhook_id?: string
          event_type?: string
          payload?: Json
          response_status?: number | null
          response_body?: string | null
          success?: boolean
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      search_history: {
        Row: {
          id: string
          user_id: string
          query: string
          filters: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          filters?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          filters?: Json
          created_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          id: string
          user_id: string
          name: string
          query: string
          filters: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          query: string
          filters?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          query?: string
          filters?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_import_jobs: {
        Row: {
          id: string
          user_id: string
          team_id: string
          entity: string
          file_name: string | null
          status: string
          total_rows: number
          success_count: number
          error_count: number
          errors: Json
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          team_id: string
          entity: string
          file_name?: string | null
          status?: string
          total_rows?: number
          success_count?: number
          error_count?: number
          errors?: Json
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string
          entity?: string
          file_name?: string | null
          status?: string
          total_rows?: number
          success_count?: number
          error_count?: number
          errors?: Json
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      data_export_jobs: {
        Row: {
          id: string
          user_id: string
          team_id: string
          entity: string
          file_name: string | null
          status: string
          row_count: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          team_id: string
          entity: string
          file_name?: string | null
          status?: string
          row_count?: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string
          entity?: string
          file_name?: string | null
          status?: string
          row_count?: number
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_enabled: boolean
          in_app_enabled: boolean
          push_enabled: boolean
          proposals_enabled: boolean
          deals_enabled: boolean
          system_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          push_enabled?: boolean
          proposals_enabled?: boolean
          deals_enabled?: boolean
          system_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          push_enabled?: boolean
          proposals_enabled?: boolean
          deals_enabled?: boolean
          system_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: Record<string, never>
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
