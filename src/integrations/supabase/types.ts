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
      contribution_event_payments: {
        Row: {
          created_at: string
          event_id: string
          id: string
          member_id: string
          paid: boolean
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          member_id: string
          paid?: boolean
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          member_id?: string
          paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contribution_event_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contribution_events"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_events: {
        Row: {
          amount_per_person: number
          created_at: string
          created_by: string
          goal_description: string | null
          id: string
          is_completed: boolean
          target_amount: number
          title: string
        }
        Insert: {
          amount_per_person?: number
          created_at?: string
          created_by: string
          goal_description?: string | null
          id?: string
          is_completed?: boolean
          target_amount?: number
          title: string
        }
        Update: {
          amount_per_person?: number
          created_at?: string
          created_by?: string
          goal_description?: string | null
          id?: string
          is_completed?: boolean
          target_amount?: number
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
          game_type: string
          id: string
          opponent: string
          our_score: number
          their_score: number
          venue: string | null
        }
        Insert: {
          created_at?: string
          date: string
          game_type?: string
          id?: string
          opponent: string
          our_score?: number
          their_score?: number
          venue?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          game_type?: string
          id?: string
          opponent?: string
          our_score?: number
          their_score?: number
          venue?: string | null
        }
        Relationships: []
      }
      homepage_images: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      league_standings: {
        Row: {
          drawn: number
          goal_difference: number
          id: string
          lost: number
          played: number
          points: number
          updated_at: string
          won: number
        }
        Insert: {
          drawn?: number
          goal_difference?: number
          id?: string
          lost?: number
          played?: number
          points?: number
          updated_at?: string
          won?: number
        }
        Update: {
          drawn?: number
          goal_difference?: number
          id?: string
          lost?: number
          played?: number
          points?: number
          updated_at?: string
          won?: number
        }
        Relationships: []
      }
      league_teams: {
        Row: {
          created_at: string
          division: string
          drawn: number
          goal_difference: number
          id: string
          is_own_team: boolean
          lost: number
          played: number
          points: number
          team_name: string
          won: number
        }
        Insert: {
          created_at?: string
          division?: string
          drawn?: number
          goal_difference?: number
          id?: string
          is_own_team?: boolean
          lost?: number
          played?: number
          points?: number
          team_name: string
          won?: number
        }
        Update: {
          created_at?: string
          division?: string
          drawn?: number
          goal_difference?: number
          id?: string
          is_own_team?: boolean
          lost?: number
          played?: number
          points?: number
          team_name?: string
          won?: number
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
      match_performances: {
        Row: {
          aerial_duels: number
          assists: number
          blocks: number
          clean_sheet: boolean
          clearances: number
          created_at: string
          game_id: string
          goals: number
          id: string
          interceptions: number
          is_potm: boolean
          player_id: string
          rating: number
          saves: number
          tackles: number
        }
        Insert: {
          aerial_duels?: number
          assists?: number
          blocks?: number
          clean_sheet?: boolean
          clearances?: number
          created_at?: string
          game_id: string
          goals?: number
          id?: string
          interceptions?: number
          is_potm?: boolean
          player_id: string
          rating?: number
          saves?: number
          tackles?: number
        }
        Update: {
          aerial_duels?: number
          assists?: number
          blocks?: number
          clean_sheet?: boolean
          clearances?: number
          created_at?: string
          game_id?: string
          goals?: number
          id?: string
          interceptions?: number
          is_potm?: boolean
          player_id?: string
          rating?: number
          saves?: number
          tackles?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_performances_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_scores"
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
          aerial_duels: number
          assists: number
          blocks: number
          clean_sheets: number
          clearances: number
          created_at: string
          direct_shots: number
          direct_targets: number
          excused: boolean
          excused_days: string[] | null
          excused_type: string | null
          fan_badge: string | null
          fan_points: number
          favourite_moment: string | null
          games_played: number
          goals: number
          id: string
          interceptions: number
          name: string
          phone: string | null
          pin: string | null
          position: string | null
          profile_pic_url: string | null
          role: string
          saves: number
          squad_number: number | null
          successful_tackles: number
          tackles: number
          username: string | null
        }
        Insert: {
          aerial_duels?: number
          assists?: number
          blocks?: number
          clean_sheets?: number
          clearances?: number
          created_at?: string
          direct_shots?: number
          direct_targets?: number
          excused?: boolean
          excused_days?: string[] | null
          excused_type?: string | null
          fan_badge?: string | null
          fan_points?: number
          favourite_moment?: string | null
          games_played?: number
          goals?: number
          id: string
          interceptions?: number
          name: string
          phone?: string | null
          pin?: string | null
          position?: string | null
          profile_pic_url?: string | null
          role?: string
          saves?: number
          squad_number?: number | null
          successful_tackles?: number
          tackles?: number
          username?: string | null
        }
        Update: {
          aerial_duels?: number
          assists?: number
          blocks?: number
          clean_sheets?: number
          clearances?: number
          created_at?: string
          direct_shots?: number
          direct_targets?: number
          excused?: boolean
          excused_days?: string[] | null
          excused_type?: string | null
          fan_badge?: string | null
          fan_points?: number
          favourite_moment?: string | null
          games_played?: number
          goals?: number
          id?: string
          interceptions?: number
          name?: string
          phone?: string | null
          pin?: string | null
          position?: string | null
          profile_pic_url?: string | null
          role?: string
          saves?: number
          squad_number?: number | null
          successful_tackles?: number
          tackles?: number
          username?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          from_id: string
          id: string
          read: boolean
          to_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_id: string
          id?: string
          read?: boolean
          to_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_id?: string
          id?: string
          read?: boolean
          to_id?: string
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
      season_config: {
        Row: {
          created_at: string
          created_by: string
          end_date: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
        }
        Relationships: []
      }
      weekly_overviews: {
        Row: {
          created_at: string
          data: Json
          id: string
          type: string
          week_start: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          type?: string
          week_start: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          type?: string
          week_start?: string
        }
        Relationships: []
      }
      weekly_stats_log: {
        Row: {
          aerial_duels: number
          assists: number
          blocks: number
          clean_sheets: number
          clearances: number
          created_at: string
          direct_shots: number
          direct_targets: number
          games_played: number
          goals: number
          id: string
          interceptions: number
          player_id: string
          saves: number
          successful_tackles: number
          tackles: number
          week_start: string
        }
        Insert: {
          aerial_duels?: number
          assists?: number
          blocks?: number
          clean_sheets?: number
          clearances?: number
          created_at?: string
          direct_shots?: number
          direct_targets?: number
          games_played?: number
          goals?: number
          id?: string
          interceptions?: number
          player_id: string
          saves?: number
          successful_tackles?: number
          tackles?: number
          week_start: string
        }
        Update: {
          aerial_duels?: number
          assists?: number
          blocks?: number
          clean_sheets?: number
          clearances?: number
          created_at?: string
          direct_shots?: number
          direct_targets?: number
          games_played?: number
          goals?: number
          id?: string
          interceptions?: number
          player_id?: string
          saves?: number
          successful_tackles?: number
          tackles?: number
          week_start?: string
        }
        Relationships: []
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
