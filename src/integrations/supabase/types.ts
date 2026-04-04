export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          category: string
          claimed_at: string | null
          cookie_file: string | null
          cookie_file_name: string | null
          created_by: string | null
          dropped_at: string
          email: string
          games: string | null
          id: string
          is_claimed: boolean
          netflix_type: string | null
          notes: string | null
          password: string
          plan_details: string | null
          screenshot: string | null
          slug: string | null
          thumbnail: string | null
          title: string
        }
        Insert: {
          category?: string
          claimed_at?: string | null
          cookie_file?: string | null
          cookie_file_name?: string | null
          created_by?: string | null
          dropped_at?: string
          email?: string
          games?: string | null
          id?: string
          is_claimed?: boolean
          netflix_type?: string | null
          notes?: string | null
          password?: string
          plan_details?: string | null
          screenshot?: string | null
          slug?: string | null
          thumbnail?: string | null
          title: string
        }
        Update: {
          category?: string
          claimed_at?: string | null
          cookie_file?: string | null
          cookie_file_name?: string | null
          created_by?: string | null
          dropped_at?: string
          email?: string
          games?: string | null
          id?: string
          is_claimed?: boolean
          netflix_type?: string | null
          notes?: string | null
          password?: string
          plan_details?: string | null
          screenshot?: string | null
          slug?: string | null
          thumbnail?: string | null
          title?: string
        }
        Relationships: []
      }
      ad_redirect_logs: {
        Row: {
          block_type: string
          blocked_url: string
          created_at: string
          id: string
          page_url: string | null
          source_slot: string | null
          user_agent: string | null
        }
        Insert: {
          block_type?: string
          blocked_url: string
          created_at?: string
          id?: string
          page_url?: string | null
          source_slot?: string | null
          user_agent?: string | null
        }
        Update: {
          block_type?: string
          blocked_url?: string
          created_at?: string
          id?: string
          page_url?: string | null
          source_slot?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ad_slots: {
        Row: {
          ad_code: string
          id: string
          is_active: boolean
          slot_name: string
          updated_at: string
        }
        Insert: {
          ad_code?: string
          id?: string
          is_active?: boolean
          slot_name: string
          updated_at?: string
        }
        Update: {
          ad_code?: string
          id?: string
          is_active?: boolean
          slot_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          link_text: string | null
          link_url: string | null
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          account_id: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_drops: {
        Row: {
          approved_at: string | null
          category: string
          claimed_at: string | null
          created_at: string
          email: string
          id: string
          is_claimed: boolean
          password: string
          rejected_at: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          category?: string
          claimed_at?: string | null
          created_at?: string
          email: string
          id?: string
          is_claimed?: boolean
          password: string
          rejected_at?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          category?: string
          claimed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          is_claimed?: boolean
          password?: string
          rejected_at?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          id: string
          visited_at: string
        }
        Insert: {
          id?: string
          visited_at?: string
        }
        Update: {
          id?: string
          visited_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quick_links: {
        Row: {
          created_at: string
          href: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          href?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sub_accounts: {
        Row: {
          account_id: string
          cookie_file: string | null
          cookie_file_name: string | null
          created_at: string
          email: string
          games: string | null
          id: string
          label: string
          notes: string | null
          password: string
          sort_order: number
        }
        Insert: {
          account_id: string
          cookie_file?: string | null
          cookie_file_name?: string | null
          created_at?: string
          email?: string
          games?: string | null
          id?: string
          label?: string
          notes?: string | null
          password?: string
          sort_order?: number
        }
        Update: {
          account_id?: string
          cookie_file?: string | null
          cookie_file_name?: string | null
          created_at?: string
          email?: string
          games?: string | null
          id?: string
          label?: string
          notes?: string | null
          password?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sub_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      vip_subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          granted_by: string | null
          id: string
          plan_name: string
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          granted_by?: string | null
          id?: string
          plan_name?: string
          starts_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          granted_by?: string | null
          id?: string
          plan_name?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_username_available: { Args: { username: string }; Returns: boolean }
      is_vip: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
