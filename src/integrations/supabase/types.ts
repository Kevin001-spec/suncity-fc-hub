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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          day: string
          id: string
          player_id: string
          status: string
          updated_by: string | null
          week_start: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          player_id: string
          status?: string
          updated_by?: string | null
          week_start: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          player_id?: string
          status?: string
          updated_by?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          id: string
          member_id: string
          month_key: string
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          month_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          month_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          record_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date: string
          description: string
          id?: string
          record_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_expenses_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "financial_records"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          closing_balance: number
          contributions: number
          contributor_note: string | null
          contributors: number
          created_at: string
          id: string
          month: string
          opening_balance: number
        }
        Insert: {
          closing_balance?: number
          contributions?: number
          contributor_note?: string | null
          contributors?: number
          created_at?: string
          id?: string
          month: string
          opening_balance?: number
        }
        Update: {
          closing_balance?: number
          contributions?: number
          contributor_note?: string | null
          contributors?: number
          created_at?: string
          id?: string
          month?: string
          opening_balance?: number
        }
        Relationships: []
      }
      game_scorers: {
        Row: {
          game_id: string
          id: string
          player_id: string
        }
        Insert: {
          game_id: string
          id?: string
          player_id: string
        }
        Update: {
          game_id?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scorers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_scorers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          created_at: string
          date: string
          id: string
          opponent: string
          our_score: number
          their_score: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          opponent: string
          our_score?: number
          their_score?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          opponent?: string
          our_score?: number
          their_score?: number
        }
        Relationships: []
      }
      lineup_positions: {
        Row: {
          id: string
          label: string
          player_id: string | null
          position_id: string
        }
        Insert: {
          id?: string
          label: string
          player_id?: string | null
          position_id: string
        }
        Update: {
          id?: string
          label?: string
          player_id?: string | null
          position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineup_positions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          caption: string | null
          created_at: string
          date: string
          id: string
          uploaded_by: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          date: string
          id?: string
          uploaded_by: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          date?: string
          id?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          assists: number
          created_at: string
          excused: boolean
          excused_days: string[] | null
          excused_type: string | null
          games_played: number
          goals: number
          id: string
          name: string
          phone: string | null
          pin: string | null
          position: string | null
          profile_pic_url: string | null
          role: string
          squad_number: number | null
          username: string | null
        }
        Insert: {
          assists?: number
          created_at?: string
          excused?: boolean
          excused_days?: string[] | null
          excused_type?: string | null
          games_played?: number
          goals?: number
          id: string
          name: string
          phone?: string | null
          pin?: string | null
          position?: string | null
          profile_pic_url?: string | null
          role?: string
          squad_number?: number | null
          username?: string | null
        }
        Update: {
          assists?: number
          created_at?: string
          excused?: boolean
          excused_days?: string[] | null
          excused_type?: string | null
          games_played?: number
          goals?: number
          id?: string
          name?: string
          phone?: string | null
          pin?: string | null
          position?: string | null
          profile_pic_url?: string | null
          role?: string
          squad_number?: number | null
          username?: string | null
        }
        Relationships: []
      }
      pending_approvals: {
        Row: {
          id: string
          month_key: string
          month_label: string
          player_id: string
          player_name: string
          rejection_note: string | null
          requested_at: string
        }
        Insert: {
          id?: string
          month_key: string
          month_label: string
          player_id: string
          player_name: string
          rejection_note?: string | null
          requested_at?: string
        }
        Update: {
          id?: string
          month_key?: string
          month_label?: string
          player_id?: string
          player_name?: string
          rejection_note?: string | null
          requested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_approvals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
