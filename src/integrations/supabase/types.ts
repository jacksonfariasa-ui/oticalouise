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
      cliente_vendas: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          dados: Json
          id: string
          numero: string
          tipo: string
          total: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          dados?: Json
          id?: string
          numero: string
          tipo: string
          total?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          dados?: Json
          id?: string
          numero?: string
          tipo?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cliente_vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cidade: string
          cpf: string
          created_at: string
          email: string
          id: string
          nascimento: string
          nome: string
          telefone: string
        }
        Insert: {
          cidade?: string
          cpf?: string
          created_at?: string
          email?: string
          id?: string
          nascimento?: string
          nome: string
          telefone?: string
        }
        Update: {
          cidade?: string
          cpf?: string
          created_at?: string
          email?: string
          id?: string
          nascimento?: string
          nome?: string
          telefone?: string
        }
        Relationships: []
      }
      dados_salvos: {
        Row: {
          chave: string
          dados: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          chave: string
          dados?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          chave?: string
          dados?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      empresa_config: {
        Row: {
          cnpj: string
          cor_primaria: string | null
          email: string
          endereco: string
          id: number
          logo_url: string | null
          nome: string
          slogan: string
          telefone: string
          updated_at: string
        }
        Insert: {
          cnpj?: string
          cor_primaria?: string | null
          email?: string
          endereco?: string
          id?: number
          logo_url?: string | null
          nome?: string
          slogan?: string
          telefone?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string
          cor_primaria?: string | null
          email?: string
          endereco?: string
          id?: number
          logo_url?: string | null
          nome?: string
          slogan?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      filiais_info: {
        Row: {
          cidade: string
          cnpj: string
          email: string
          endereco: string
          gerente: string
          horario: string
          id: string
          nome: string
          status: string
          telefone: string
          updated_at: string
        }
        Insert: {
          cidade?: string
          cnpj?: string
          email?: string
          endereco?: string
          gerente?: string
          horario?: string
          id: string
          nome: string
          status?: string
          telefone?: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          cnpj?: string
          email?: string
          endereco?: string
          gerente?: string
          horario?: string
          id?: string
          nome?: string
          status?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_config: {
        Row: {
          aliquota_iss: number
          ambiente: string
          certificado_validade: string | null
          cfop_padrao: string
          cnpj: string
          codigo_municipio: string
          codigo_servico: string
          csc_id: string
          csc_token: string
          cst_padrao: string
          id: number
          inscricao_estadual: string
          inscricao_municipal: string
          municipio: string
          ncm_padrao: string
          provedor: string
          razao_social: string
          regime_tributario: string
          serie_nfce: string
          serie_nfe: string
          token: string
          uf: string
          updated_at: string
        }
        Insert: {
          aliquota_iss?: number
          ambiente?: string
          certificado_validade?: string | null
          cfop_padrao?: string
          cnpj?: string
          codigo_municipio?: string
          codigo_servico?: string
          csc_id?: string
          csc_token?: string
          cst_padrao?: string
          id?: number
          inscricao_estadual?: string
          inscricao_municipal?: string
          municipio?: string
          ncm_padrao?: string
          provedor?: string
          razao_social?: string
          regime_tributario?: string
          serie_nfce?: string
          serie_nfe?: string
          token?: string
          uf?: string
          updated_at?: string
        }
        Update: {
          aliquota_iss?: number
          ambiente?: string
          certificado_validade?: string | null
          cfop_padrao?: string
          cnpj?: string
          codigo_municipio?: string
          codigo_servico?: string
          csc_id?: string
          csc_token?: string
          cst_padrao?: string
          id?: number
          inscricao_estadual?: string
          inscricao_municipal?: string
          municipio?: string
          ncm_padrao?: string
          provedor?: string
          razao_social?: string
          regime_tributario?: string
          serie_nfce?: string
          serie_nfe?: string
          token?: string
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      notas_fiscais: {
        Row: {
          ambiente: string
          chave: string
          cliente_doc: string
          cliente_nome: string
          created_at: string
          created_by: string | null
          dados: Json
          id: string
          mensagem: string
          numero: string
          ref: string
          serie: string
          status: string
          tipo: string
          url_pdf: string
          url_xml: string
          valor: number
        }
        Insert: {
          ambiente?: string
          chave?: string
          cliente_doc?: string
          cliente_nome?: string
          created_at?: string
          created_by?: string | null
          dados?: Json
          id?: string
          mensagem?: string
          numero?: string
          ref: string
          serie?: string
          status?: string
          tipo: string
          url_pdf?: string
          url_xml?: string
          valor?: number
        }
        Update: {
          ambiente?: string
          chave?: string
          cliente_doc?: string
          cliente_nome?: string
          created_at?: string
          created_by?: string | null
          dados?: Json
          id?: string
          mensagem?: string
          numero?: string
          ref?: string
          serie?: string
          status?: string
          tipo?: string
          url_pdf?: string
          url_xml?: string
          valor?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acessos: string[] | null
          created_at: string
          email: string
          filial: string | null
          id: string
          nome: string
        }
        Insert: {
          acessos?: string[] | null
          created_at?: string
          email?: string
          filial?: string | null
          id: string
          nome?: string
        }
        Update: {
          acessos?: string[] | null
          created_at?: string
          email?: string
          filial?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      equipe_filiais: {
        Args: never
        Returns: {
          filial: string
          nome: string
          role: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gerente" | "vendedor" | "tecnico"
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
    Enums: {
      app_role: ["admin", "gerente", "vendedor", "tecnico"],
    },
  },
} as const
