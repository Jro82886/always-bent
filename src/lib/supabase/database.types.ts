// Mock database types to prevent build errors
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          captain_name: string;
          boat_name: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: any;
        Update: any;
      };
      bites: {
        Row: any;
        Insert: any;
        Update: any;
      };
      analysis_reports: {
        Row: any;
        Insert: any;
        Update: any;
      };
    };
  };
}
