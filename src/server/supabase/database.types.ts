// Generated from the BreatheWise-AI Supabase project schema.
// Regenerate after every database migration; do not edit manually.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_routines: {
        Row: {
          completed_date: string | null
          created_at: string
          environment: string
          flexibility: string
          household_id: string
          id: string
          member_ids_json: Json
          notes: string
          preferred_window: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          created_at: string
          environment: string
          flexibility: string
          household_id: string
          id: string
          member_ids_json?: Json
          notes?: string
          preferred_window: string
          title: string
          updated_at: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          environment?: string
          flexibility?: string
          household_id?: string
          id?: string
          member_ids_json?: Json
          notes?: string
          preferred_window?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_routines_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      app_sessions: {
        Row: {
          created_at: string
          expires_at: string
          household_id: string
          last_seen_at: string
          token_hash: string
        }
        Insert: {
          created_at: string
          expires_at: string
          household_id: string
          last_seen_at: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          household_id?: string
          last_seen_at?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_sessions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      cams_forecasts: {
        Row: {
          city: string
          data_type: string
          expected_aqi_india: number | null
          expected_pm10: number | null
          expected_pm25: number | null
          forecast_date: string
          grid_resolution_note: string
          household_id: string | null
          id: string
          is_demo_fixture: boolean
          issued_at: string
          license_attribution: string
          provider_label: string
          time_window: string
          trend: string
        }
        Insert: {
          city: string
          data_type?: string
          expected_aqi_india?: number | null
          expected_pm10?: number | null
          expected_pm25?: number | null
          forecast_date: string
          grid_resolution_note: string
          household_id?: string | null
          id: string
          is_demo_fixture?: boolean
          issued_at: string
          license_attribution: string
          provider_label: string
          time_window: string
          trend: string
        }
        Update: {
          city?: string
          data_type?: string
          expected_aqi_india?: number | null
          expected_pm10?: number | null
          expected_pm25?: number | null
          forecast_date?: string
          grid_resolution_note?: string
          household_id?: string | null
          id?: string
          is_demo_fixture?: boolean
          issued_at?: string
          license_attribution?: string
          provider_label?: string
          time_window?: string
          trend?: string
        }
        Relationships: [
          {
            foreignKeyName: "cams_forecasts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      data_licenses: {
        Row: {
          attribution_required: boolean
          attribution_text: string
          commercial_allowed: boolean
          id: string
          license_name: string
          license_url: string
          provider_id: string
        }
        Insert: {
          attribution_required?: boolean
          attribution_text: string
          commercial_allowed?: boolean
          id: string
          license_name: string
          license_url?: string
          provider_id: string
        }
        Update: {
          attribution_required?: boolean
          attribution_text?: string
          commercial_allowed?: boolean
          id?: string
          license_name?: string
          license_url?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_licenses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "data_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      data_providers: {
        Row: {
          base_url: string
          id: string
          name: string
          notes: string
          requires_api_key: boolean
          status: string
          updated_at: string
        }
        Insert: {
          base_url: string
          id: string
          name: string
          notes?: string
          requires_api_key?: boolean
          status: string
          updated_at: string
        }
        Update: {
          base_url?: string
          id?: string
          name?: string
          notes?: string
          requires_api_key?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      environmental_snapshots: {
        Row: {
          city: string
          classification: string
          coordinates_json: Json | null
          data_type: string
          freshness: string
          id: string
          is_available: boolean
          is_demo_fixture: boolean
          license_attribution: string
          location_label: string
          measured_at: string | null
          pollutants_json: Json
          provider: string
          provider_label: string
          quality_json: Json
          reported_aqi_india: number | null
          retrieved_at: string
          spatial_resolution_note: string
          station_or_grid_id: string
          warnings_json: Json
          weather_json: Json
        }
        Insert: {
          city: string
          classification?: string
          coordinates_json?: Json | null
          data_type: string
          freshness: string
          id: string
          is_available?: boolean
          is_demo_fixture?: boolean
          license_attribution: string
          location_label: string
          measured_at?: string | null
          pollutants_json?: Json
          provider: string
          provider_label: string
          quality_json?: Json
          reported_aqi_india?: number | null
          retrieved_at: string
          spatial_resolution_note: string
          station_or_grid_id: string
          warnings_json?: Json
          weather_json?: Json
        }
        Update: {
          city?: string
          classification?: string
          coordinates_json?: Json | null
          data_type?: string
          freshness?: string
          id?: string
          is_available?: boolean
          is_demo_fixture?: boolean
          license_attribution?: string
          location_label?: string
          measured_at?: string | null
          pollutants_json?: Json
          provider?: string
          provider_label?: string
          quality_json?: Json
          reported_aqi_india?: number | null
          retrieved_at?: string
          spatial_resolution_note?: string
          station_or_grid_id?: string
          warnings_json?: Json
          weather_json?: Json
        }
        Relationships: []
      }
      family_members: {
        Row: {
          activity_preference: string
          age_group: string
          created_at: string
          household_id: string
          id: string
          name: string
          routine_flexibility: string
          updated_at: string
        }
        Insert: {
          activity_preference: string
          age_group: string
          created_at: string
          household_id: string
          id: string
          name: string
          routine_flexibility: string
          updated_at: string
        }
        Update: {
          activity_preference?: string
          age_group?: string
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          routine_flexibility?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          city: string
          created_at: string
          id: string
          is_demo_profile: boolean
          language: string
          locality: string
          name: string
          sensitivity_tags_json: Json
          updated_at: string
        }
        Insert: {
          city: string
          created_at: string
          id: string
          is_demo_profile?: boolean
          language?: string
          locality?: string
          name: string
          sensitivity_tags_json?: Json
          updated_at: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_demo_profile?: boolean
          language?: string
          locality?: string
          name?: string
          sensitivity_tags_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          city: string
          created_at: string
          household_id: string
          id: string
          is_primary: boolean
          label: string
          latitude: number | null
          locality: string
          longitude: number | null
          updated_at: string
        }
        Insert: {
          city: string
          created_at: string
          household_id: string
          id: string
          is_primary?: boolean
          label: string
          latitude?: number | null
          locality?: string
          longitude?: number | null
          updated_at: string
        }
        Update: {
          city?: string
          created_at?: string
          household_id?: string
          id?: string
          is_primary?: boolean
          label?: string
          latitude?: number | null
          locality?: string
          longitude?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_evidence: {
        Row: {
          aqi_value: number | null
          data_type: string
          freshness: string
          id: string
          is_demo_fixture: boolean
          measured_at: string | null
          plan_id: string
          pm10: number | null
          pm25: number | null
          provider_label: string
          retrieved_at: string
          snapshot_id: string | null
          station_or_grid_id: string
        }
        Insert: {
          aqi_value?: number | null
          data_type: string
          freshness: string
          id: string
          is_demo_fixture?: boolean
          measured_at?: string | null
          plan_id: string
          pm10?: number | null
          pm25?: number | null
          provider_label: string
          retrieved_at: string
          snapshot_id?: string | null
          station_or_grid_id: string
        }
        Update: {
          aqi_value?: number | null
          data_type?: string
          freshness?: string
          id?: string
          is_demo_fixture?: boolean
          measured_at?: string | null
          plan_id?: string
          pm10?: number | null
          pm25?: number | null
          provider_label?: string
          retrieved_at?: string
          snapshot_id?: string | null
          station_or_grid_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_evidence_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "protection_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_evidence_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "environmental_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_plans: {
        Row: {
          aqi_band: string
          aqi_value: number | null
          city: string
          freshness: string
          generated_at: string
          household_id: string
          id: string
          is_demo_fixture: boolean
          plan_json: Json
          rule_set_version: string
        }
        Insert: {
          aqi_band: string
          aqi_value?: number | null
          city: string
          freshness: string
          generated_at: string
          household_id: string
          id: string
          is_demo_fixture?: boolean
          plan_json: Json
          rule_set_version?: string
        }
        Update: {
          aqi_band?: string
          aqi_value?: number | null
          city?: string
          freshness?: string
          generated_at?: string
          household_id?: string
          id?: string
          is_demo_fixture?: boolean
          plan_json?: Json
          rule_set_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "protection_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          applicable_members_json: Json
          confidence_key: string
          created_at: string
          household_id: string
          id: string
          plan_id: string
          rec_key: string
          severity: string
          source_timestamp: string | null
          title_key: string
        }
        Insert: {
          applicable_members_json?: Json
          confidence_key: string
          created_at: string
          household_id: string
          id: string
          plan_id: string
          rec_key: string
          severity: string
          source_timestamp?: string | null
          title_key: string
        }
        Update: {
          applicable_members_json?: Json
          confidence_key?: string
          created_at?: string
          household_id?: string
          id?: string
          plan_id?: string
          rec_key?: string
          severity?: string
          source_timestamp?: string | null
          title_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "protection_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_runs: {
        Row: {
          created_at: string
          household_id: string
          id: string
          label: string
          result_json: Json
        }
        Insert: {
          created_at: string
          household_id: string
          id: string
          label: string
          result_json: Json
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          label?: string
          result_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scenario_runs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          applied_at: string
          name: string
          version: number
        }
        Insert: {
          applied_at?: string
          name: string
          version: number
        }
        Update: {
          applied_at?: string
          name?: string
          version?: number
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          default_city: string
          household_id: string
          language: string
          simulate_outage: boolean
          updated_at: string
          use_demo_fixtures: boolean
        }
        Insert: {
          default_city?: string
          household_id: string
          language?: string
          simulate_outage?: boolean
          updated_at: string
          use_demo_fixtures?: boolean
        }
        Update: {
          default_city?: string
          household_id?: string
          language?: string
          simulate_outage?: boolean
          updated_at?: string
          use_demo_fixtures?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
