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
      banner_settings: {
        Row: {
          enabled: boolean
          id: string
          message: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          message?: string
        }
        Update: {
          enabled?: boolean
          id?: string
          message?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image: string | null
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cost_price: number
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          selected_flavors: string[] | null
          selected_weight: string | number | null
          unit_price: number
        }
        Insert: {
          cost_price?: number
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          selected_flavors?: string[] | null
          selected_weight?: string | number | null
          unit_price?: number
        }
        Update: {
          cost_price?: number
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          selected_flavors?: string[] | null
          selected_weight?: string | number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          order_number: string
          total: number
          total_cost: number
          status: string
          customer_name: string
          customer_phone: string
          customer_address: string
          customer_city: string
          notes: string | null
          status_history: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_number: string
          total?: number
          total_cost?: number
          status?: string
          customer_name: string
          customer_phone: string
          customer_address: string
          customer_city: string
          notes?: string | null
          status_history?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          order_number?: string
          total?: number
          total_cost?: number
          status?: string
          customer_name?: string
          customer_phone?: string
          customer_address?: string
          customer_city?: string
          notes?: string | null
          status_history?: Json | null
        }
        Relationships: []
      }
      pack_items: {
        Row: {
          id: string
          pack_id: string
          product_id: string
          quantity: number
          selected_weight: string | null
        }
        Insert: {
          id?: string
          pack_id: string
          product_id: string
          quantity?: number
          selected_weight?: string | null
        }
        Update: {
          id?: string
          pack_id?: string
          product_id?: string
          quantity?: number
          selected_weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pack_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging: {
        Row: {
          active: boolean
          cost_price: number
          created_at: string
          description: string | null
          id: string
          image: string | null
          name: string
          stock: number
        }
        Insert: {
          active?: boolean
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name: string
          stock?: number
        }
        Update: {
          active?: boolean
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          stock?: number
        }
        Relationships: []
      }
      packs: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          featured: boolean | null
          free_shipping: boolean | null
          id: string
          image: string | null
          long_description: string | null
          name: string
          price: number
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          featured?: boolean | null
          free_shipping?: boolean | null
          id?: string
          image?: string | null
          long_description?: string | null
          name: string
          price?: number
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          featured?: boolean | null
          free_shipping?: boolean | null
          id?: string
          image?: string | null
          long_description?: string | null
          name?: string
          price?: number
          slug?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          image_url: string
          position: number
          product_id: string
        }
        Insert: {
          id?: string
          image_url: string
          position?: number
          product_id: string
        }
        Update: {
          id?: string
          image_url?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          cost_price: number | null
          created_at: string
          description: string | null
          featured: boolean | null
          flavors: string[] | null
          free_shipping: boolean | null
          id: string
          is_new: boolean | null
          long_description: string | null
          materials: string | null
          name: string
          original_price: number | null
          price: number
          slug: string
          stock: number
          updated_at: string
          visible: boolean
          weight: string | number | null
          weight_prices: Json | null
        }
        Insert: {
          active?: boolean
          cost_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          flavors?: string[] | null
          free_shipping?: boolean | null
          id?: string
          is_new?: boolean | null
          long_description?: string | null
          materials?: string | null
          name: string
          original_price?: number | null
          price?: number
          slug: string
          stock?: number
          updated_at?: string
          visible?: boolean
          weight?: string | number | null
          weight_prices?: Json | null
        }
        Update: {
          active?: boolean
          cost_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          flavors?: string[] | null
          free_shipping?: boolean | null
          id?: string
          is_new?: boolean | null
          long_description?: string | null
          materials?: string | null
          name?: string
          original_price?: number | null
          price?: number
          slug?: string
          stock?: number
          updated_at?: string
          visible?: boolean
          weight?: string | number | null
          weight_prices?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          applies_to: string
          code: string
          created_at: string
          current_uses: number
          discount_percent: number
          expires_at: string | null
          id: string
          max_uses: number | null
          pack_ids: string[] | null
          product_ids: string[] | null
        }
        Insert: {
          active?: boolean
          applies_to?: string
          code: string
          created_at?: string
          current_uses?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          pack_ids?: string[] | null
          product_ids?: string[] | null
        }
        Update: {
          active?: boolean
          applies_to?: string
          code?: string
          created_at?: string
          current_uses?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          pack_ids?: string[] | null
          product_ids?: string[] | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          buy_quantity: number | null
          category_ids: string[] | null
          created_at: string
          discount_percent: number | null
          ends_at: string
          get_product_id: string | null
          get_quantity: number | null
          id: string
          is_flash: boolean
          name: string
          pack_ids: string[] | null
          product_ids: string[] | null
          starts_at: string
          target_type: string
          target_weights: Json | null
          tier_rules: Json | null
          type: string
        }
        Insert: {
          active?: boolean
          buy_quantity?: number | null
          category_ids?: string[] | null
          created_at?: string
          discount_percent?: number | null
          ends_at: string
          get_product_id?: string | null
          get_quantity?: number | null
          id?: string
          is_flash?: boolean
          name: string
          pack_ids?: string[] | null
          product_ids?: string[] | null
          starts_at?: string
          target_type?: string
          target_weights?: Json | null
          tier_rules?: Json | null
          type?: string
        }
        Update: {
          active?: boolean
          buy_quantity?: number | null
          category_ids?: string[] | null
          created_at?: string
          discount_percent?: number | null
          ends_at?: string
          get_product_id?: string | null
          get_quantity?: number | null
          id?: string
          is_flash?: boolean
          name?: string
          pack_ids?: string[] | null
          product_ids?: string[] | null
          starts_at?: string
          target_type?: string
          target_weights?: Json | null
          tier_rules?: Json | null
          type?: string
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
