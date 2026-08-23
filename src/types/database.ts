export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MessagingPlatform = "sms" | "whatsapp" | "telegram";

export type LinkStatus = "active" | "inactive";

export interface Database {
  public: {
    Tables: {
      links: {
        Row: {
          id: string;
          slug: string;
          name: string;
          recipient_number: string;
          message: string;
          platform: MessagingPlatform;
          status: LinkStatus;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          recipient_number: string;
          message: string;
          platform?: MessagingPlatform;
          status?: LinkStatus;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          recipient_number?: string;
          message?: string;
          platform?: MessagingPlatform;
          status?: LinkStatus;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "links_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      clicks: {
        Row: {
          id: string;
          link_id: string;
          clicked_at: string;
          device_type: string | null;
          browser: string | null;
          os: string | null;
        };
        Insert: {
          id?: string;
          link_id: string;
          clicked_at?: string;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
        };
        Update: {
          id?: string;
          link_id?: string;
          clicked_at?: string;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clicks_link_id_fkey";
            columns: ["link_id"];
            referencedRelation: "links";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      link_stats: {
        Row: {
          link_id: string;
          total_clicks: number;
          last_opened: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: { uid: string };
        Returns: boolean;
      };
      resolve_link: {
        Args: { p_slug: string };
        Returns: Array<{
          id: string;
          slug: string;
          recipient_number: string;
          message: string;
          platform: MessagingPlatform;
          status: LinkStatus;
        }>;
      };
    };
    Enums: {
      messaging_platform: MessagingPlatform;
    };
    CompositeTypes: Record<string, never>;
  };
}
