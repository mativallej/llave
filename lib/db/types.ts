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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acceso: {
        Row: {
          abierto_en: string | null
          caso_id: string
          rol: string
          token: string
        }
        Insert: {
          abierto_en?: string | null
          caso_id: string
          rol: string
          token: string
        }
        Update: {
          abierto_en?: string | null
          caso_id?: string
          rol?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "acceso_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "caso"
            referencedColumns: ["id"]
          },
        ]
      }
      auto: {
        Row: {
          actualizado_en: string
          anio: number | null
          creado_en: string
          fotos: string[]
          id: string
          km: number | null
          marca: string | null
          modelo: string | null
          orden: number | null
          precio: number | null
          publicado: boolean
          segmento: string | null
          slug: string
          vendido_en: string | null
          version: string | null
        }
        Insert: {
          actualizado_en?: string
          anio?: number | null
          creado_en?: string
          fotos?: string[]
          id?: string
          km?: number | null
          marca?: string | null
          modelo?: string | null
          orden?: number | null
          precio?: number | null
          publicado?: boolean
          segmento?: string | null
          slug: string
          vendido_en?: string | null
          version?: string | null
        }
        Update: {
          actualizado_en?: string
          anio?: number | null
          creado_en?: string
          fotos?: string[]
          id?: string
          km?: number | null
          marca?: string | null
          modelo?: string | null
          orden?: number | null
          precio?: number | null
          publicado?: boolean
          segmento?: string | null
          slug?: string
          vendido_en?: string | null
          version?: string | null
        }
        Relationships: []
      }
      caso: {
        Row: {
          auto_busca: string | null
          auto_entrega: Json | null
          auto_ids: string[]
          cerro: boolean | null
          creado_en: string
          estado: string
          id: string
          motivo_perdida: string | null
          nombre: string | null
          precio_salida: number | null
          ref: string
          renegocio: boolean
          salida: string | null
          telefono: string
          ultimo_evento: string | null
          valor_toma: number | null
          vence_prop: string | null
          venta_nueva: boolean | null
          zona: string | null
        }
        Insert: {
          auto_busca?: string | null
          auto_entrega?: Json | null
          auto_ids?: string[]
          cerro?: boolean | null
          creado_en?: string
          estado: string
          id?: string
          motivo_perdida?: string | null
          nombre?: string | null
          precio_salida?: number | null
          ref?: string
          renegocio?: boolean
          salida?: string | null
          telefono: string
          ultimo_evento?: string | null
          valor_toma?: number | null
          vence_prop?: string | null
          venta_nueva?: boolean | null
          zona?: string | null
        }
        Update: {
          auto_busca?: string | null
          auto_entrega?: Json | null
          auto_ids?: string[]
          cerro?: boolean | null
          creado_en?: string
          estado?: string
          id?: string
          motivo_perdida?: string | null
          nombre?: string | null
          precio_salida?: number | null
          ref?: string
          renegocio?: boolean
          salida?: string | null
          telefono?: string
          ultimo_evento?: string | null
          valor_toma?: number | null
          vence_prop?: string | null
          venta_nueva?: boolean | null
          zona?: string | null
        }
        Relationships: []
      }
      config: {
        Row: {
          actualizado_en: string
          clave: string
          nota: string
          valor: string
        }
        Insert: {
          actualizado_en?: string
          clave: string
          nota: string
          valor?: string
        }
        Update: {
          actualizado_en?: string
          clave?: string
          nota?: string
          valor?: string
        }
        Relationships: []
      }
      evento: {
        Row: {
          caso_id: string | null
          en: string
          id: number
          meta: Json
          tipo: string
        }
        Insert: {
          caso_id?: string | null
          en?: string
          id?: number
          meta?: Json
          tipo: string
        }
        Update: {
          caso_id?: string | null
          en?: string
          id?: number
          meta?: Json
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "caso"
            referencedColumns: ["id"]
          },
        ]
      }
      gasto_mes: {
        Row: {
          mes: string
          monto: number
        }
        Insert: {
          mes: string
          monto: number
        }
        Update: {
          mes?: string
          monto?: number
        }
        Relationships: []
      }
      nota: {
        Row: {
          autor: string | null
          caso_id: string
          creada_en: string
          id: number
          texto: string
        }
        Insert: {
          autor?: string | null
          caso_id: string
          creada_en?: string
          id?: never
          texto: string
        }
        Update: {
          autor?: string | null
          caso_id?: string
          creada_en?: string
          id?: never
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "nota_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "caso"
            referencedColumns: ["id"]
          },
        ]
      }
      operador: {
        Row: {
          creado_en: string
          nombre: string
          rol: string
          token: string
          ultimo_uso: string | null
        }
        Insert: {
          creado_en?: string
          nombre: string
          rol: string
          token: string
          ultimo_uso?: string | null
        }
        Update: {
          creado_en?: string
          nombre?: string
          rol?: string
          token?: string
          ultimo_uso?: string | null
        }
        Relationships: []
      }
      perfil: {
        Row: {
          creado_en: string
          id: string
          nombre: string
          rol: string
        }
        Insert: {
          creado_en?: string
          id: string
          nombre: string
          rol: string
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
          rol?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crear_pedido: {
        Args: {
          p_auto_busca: string
          p_auto_entrega: Json
          p_auto_ids: string[]
          p_estado: string
          p_meta: Json
          p_nombre: string
          p_precio_salida: number
          p_salida: string
          p_telefono: string
          p_token_cliente: string
          p_token_operador: string
          p_zona: string
        }
        Returns: {
          caso_creado_en: string
          caso_id: string
          caso_ref: string
        }[]
      }
      nueva_ref: { Args: never; Returns: string }
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
