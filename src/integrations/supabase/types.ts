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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          id: string
          meta: Json
          organization_id: string | null
          organization_type: string | null
          scope_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          id?: string
          meta?: Json
          organization_id?: string | null
          organization_type?: string | null
          scope_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          id?: string
          meta?: Json
          organization_id?: string | null
          organization_type?: string | null
          scope_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assessment_attempts: {
        Row: {
          created_at: string
          id: string
          module_id: string
          passed: boolean
          profile_role: Database["public"]["Enums"]["profile_role"]
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          passed: boolean
          profile_role: Database["public"]["Enums"]["profile_role"]
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          passed?: boolean
          profile_role?: Database["public"]["Enums"]["profile_role"]
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_tests: {
        Row: {
          id: string
          profile_label: string | null
          profile_role: Database["public"]["Enums"]["profile_role"]
          result: Json
          taken_at: string
          user_id: string
        }
        Insert: {
          id?: string
          profile_label?: string | null
          profile_role?: Database["public"]["Enums"]["profile_role"]
          result?: Json
          taken_at?: string
          user_id: string
        }
        Update: {
          id?: string
          profile_label?: string | null
          profile_role?: Database["public"]["Enums"]["profile_role"]
          result?: Json
          taken_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          icon: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          icon?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          icon?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          assessment_id: string | null
          code: string
          complementary: boolean
          course_id: string
          hours: number
          id: string
          issued_at: string
          legacy: boolean
          module_id: string | null
          profile_role: Database["public"]["Enums"]["profile_role"]
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          code?: string
          complementary?: boolean
          course_id: string
          hours?: number
          id?: string
          issued_at?: string
          legacy?: boolean
          module_id?: string | null
          profile_role?: Database["public"]["Enums"]["profile_role"]
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          code?: string
          complementary?: boolean
          course_id?: string
          hours?: number
          id?: string
          issued_at?: string
          legacy?: boolean
          module_id?: string | null
          profile_role?: Database["public"]["Enums"]["profile_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          code: string
          created_at: string
          id: string
          industry: string | null
          name: string
          owner_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          owner_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      company_employees: {
        Row: {
          company_id: string
          current_position_id: string | null
          email: string
          ended_at: string | null
          full_name: string
          id: string
          scope_id: string | null
          started_at: string
          target_position_id: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          current_position_id?: string | null
          email: string
          ended_at?: string | null
          full_name: string
          id?: string
          scope_id?: string | null
          started_at?: string
          target_position_id?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          current_position_id?: string | null
          email?: string
          ended_at?: string | null
          full_name?: string
          id?: string
          scope_id?: string | null
          started_at?: string
          target_position_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_current_position_id_fkey"
            columns: ["current_position_id"]
            isOneToOne: false
            referencedRelation: "company_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "organization_scopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_target_position_id_fkey"
            columns: ["target_position_id"]
            isOneToOne: false
            referencedRelation: "company_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_positions: {
        Row: {
          area: string
          company_id: string
          course_ids: string[]
          id: string
          name: string
          required_skills: string[]
          scope_id: string | null
        }
        Insert: {
          area?: string
          company_id: string
          course_ids?: string[]
          id?: string
          name: string
          required_skills?: string[]
          scope_id?: string | null
        }
        Update: {
          area?: string
          company_id?: string
          course_ids?: string[]
          id?: string
          name?: string
          required_skills?: string[]
          scope_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_positions_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "organization_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          game: Json
          hours: number
          id: string
          legacy: boolean
          position: number
          title: string
        }
        Insert: {
          course_id: string
          game?: Json
          hours?: number
          id?: string
          legacy?: boolean
          position?: number
          title: string
        }
        Update: {
          course_id?: string
          game?: Json
          hours?: number
          id?: string
          legacy?: boolean
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_skills: {
        Row: {
          course_id: string
          skill_id: string
        }
        Insert: {
          course_id: string
          skill_id: string
        }
        Update: {
          course_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_id: string | null
          completion_rate: number
          created_at: string
          description: string
          hours: number
          id: string
          institution_id: string | null
          instructor_id: string | null
          instructor_name: string
          level: string
          media_approved: boolean
          minutes_watched: number
          published: boolean
          rating: number
          scope_id: string | null
          slug: string
          status: string
          students_count: number
          title: string
        }
        Insert: {
          category_id?: string | null
          completion_rate?: number
          created_at?: string
          description?: string
          hours?: number
          id?: string
          institution_id?: string | null
          instructor_id?: string | null
          instructor_name?: string
          level?: string
          media_approved?: boolean
          minutes_watched?: number
          published?: boolean
          rating?: number
          scope_id?: string | null
          slug: string
          status?: string
          students_count?: number
          title: string
        }
        Update: {
          category_id?: string | null
          completion_rate?: number
          created_at?: string
          description?: string
          hours?: number
          id?: string
          institution_id?: string | null
          instructor_id?: string | null
          instructor_name?: string
          level?: string
          media_approved?: boolean
          minutes_watched?: number
          published?: boolean
          rating?: number
          scope_id?: string | null
          slug?: string
          status?: string
          students_count?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "organization_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      employability_preferences: {
        Row: {
          area: string | null
          city: string | null
          contract_type: string | null
          matching_enabled: boolean
          profile_role: Database["public"]["Enums"]["profile_role"]
          salary_range: string | null
          state: string | null
          updated_at: string
          user_id: string
          work_model: string | null
        }
        Insert: {
          area?: string | null
          city?: string | null
          contract_type?: string | null
          matching_enabled?: boolean
          profile_role?: Database["public"]["Enums"]["profile_role"]
          salary_range?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          work_model?: string | null
        }
        Update: {
          area?: string | null
          city?: string | null
          contract_type?: string | null
          matching_enabled?: boolean
          profile_role?: Database["public"]["Enums"]["profile_role"]
          salary_range?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          work_model?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          profile_role: Database["public"]["Enums"]["profile_role"]
          progress: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          profile_role?: Database["public"]["Enums"]["profile_role"]
          progress?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          profile_role?: Database["public"]["Enums"]["profile_role"]
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string
          owner_id: string | null
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          state?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          area: string
          city: string | null
          company_id: string
          contract_type: string
          created_at: string
          culture_fit: string | null
          description: string
          desired_skills: string[]
          id: string
          job_type: string
          modality: string
          required_skills: string[]
          salary_range: string | null
          scope_id: string | null
          seniority: string
          state: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Insert: {
          area?: string
          city?: string | null
          company_id: string
          contract_type?: string
          created_at?: string
          culture_fit?: string | null
          description?: string
          desired_skills?: string[]
          id?: string
          job_type?: string
          modality?: string
          required_skills?: string[]
          salary_range?: string | null
          scope_id?: string | null
          seniority?: string
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Update: {
          area?: string
          city?: string | null
          company_id?: string
          contract_type?: string
          created_at?: string
          culture_fit?: string | null
          description?: string
          desired_skills?: string[]
          id?: string
          job_type?: string
          modality?: string
          required_skills?: string[]
          salary_range?: string | null
          scope_id?: string | null
          seniority?: string
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "organization_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_profiles: {
        Row: {
          classroom: string | null
          course_name: string | null
          education_level: string | null
          employer_name: string | null
          institution_id: string | null
          institution_name: string | null
          level: number
          matching_enabled: boolean
          profile_role: Database["public"]["Enums"]["profile_role"]
          registration_number: string | null
          school_year: string | null
          seeks_job: boolean
          semester: string | null
          target_area: string | null
          target_position: string | null
          user_id: string
          works: boolean
          xp: number
        }
        Insert: {
          classroom?: string | null
          course_name?: string | null
          education_level?: string | null
          employer_name?: string | null
          institution_id?: string | null
          institution_name?: string | null
          level?: number
          matching_enabled?: boolean
          profile_role: Database["public"]["Enums"]["profile_role"]
          registration_number?: string | null
          school_year?: string | null
          seeks_job?: boolean
          semester?: string | null
          target_area?: string | null
          target_position?: string | null
          user_id: string
          works?: boolean
          xp?: number
        }
        Update: {
          classroom?: string | null
          course_name?: string | null
          education_level?: string | null
          employer_name?: string | null
          institution_id?: string | null
          institution_name?: string | null
          level?: number
          matching_enabled?: boolean
          profile_role?: Database["public"]["Enums"]["profile_role"]
          registration_number?: string | null
          school_year?: string | null
          seeks_job?: boolean
          semester?: string | null
          target_area?: string | null
          target_position?: string | null
          user_id?: string
          works?: boolean
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "learner_profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          duration_min: number
          id: string
          module_id: string | null
          position: number
          title: string
          video_path: string | null
        }
        Insert: {
          course_id: string
          duration_min?: number
          id?: string
          module_id?: string | null
          position?: number
          title: string
          video_path?: string | null
        }
        Update: {
          course_id?: string
          duration_min?: number
          id?: string
          module_id?: string | null
          position?: number
          title?: string
          video_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          job_id: string
          matched_skills: string[]
          profile_role: Database["public"]["Enums"]["profile_role"]
          reasons: string[]
          score: number
          status: Database["public"]["Enums"]["match_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          matched_skills?: string[]
          profile_role?: Database["public"]["Enums"]["profile_role"]
          reasons?: string[]
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          matched_skills?: string[]
          profile_role?: Database["public"]["Enums"]["profile_role"]
          reasons?: string[]
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      module_assessments: {
        Row: {
          id: string
          minimum_score: number
          module_id: string
          questions: Json
        }
        Insert: {
          id?: string
          minimum_score?: number
          module_id: string
          questions: Json
        }
        Update: {
          id?: string
          minimum_score?: number
          module_id?: string
          questions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "module_assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: true
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          profile_role: Database["public"]["Enums"]["profile_role"] | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          profile_role?: Database["public"]["Enums"]["profile_role"] | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          profile_role?: Database["public"]["Enums"]["profile_role"] | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_memberships: {
        Row: {
          created_at: string
          created_by: string
          email: string
          full_name: string
          function_title: string
          id: string
          last_access_at: string | null
          organization_id: string
          organization_type: string
          permissions: string[]
          scope_ids: string[]
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          full_name: string
          function_title?: string
          id?: string
          last_access_at?: string | null
          organization_id: string
          organization_type: string
          permissions?: string[]
          scope_ids?: string[]
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          full_name?: string
          function_title?: string
          id?: string
          last_access_at?: string | null
          organization_id?: string
          organization_type?: string
          permissions?: string[]
          scope_ids?: string[]
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_scopes: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          organization_id: string
          organization_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          name: string
          organization_id: string
          organization_type: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          organization_id?: string
          organization_type?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          id: string
          method: string
          paid_at: string | null
          reference: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          description?: string
          id?: string
          method?: string
          paid_at?: string | null
          reference?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          id?: string
          method?: string
          paid_at?: string | null
          reference?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          audience: Database["public"]["Enums"]["profile_role"]
          code: string
          created_at: string
          description: string
          features: string[]
          highlight: boolean
          id: string
          name: string
          position: number
          price_month_cents: number
          price_year_cents: number
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience: Database["public"]["Enums"]["profile_role"]
          code: string
          created_at?: string
          description?: string
          features?: string[]
          highlight?: boolean
          id?: string
          name: string
          position?: number
          price_month_cents?: number
          price_year_cents?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: Database["public"]["Enums"]["profile_role"]
          code?: string
          created_at?: string
          description?: string
          features?: string[]
          highlight?: boolean
          id?: string
          name?: string
          position?: number
          price_month_cents?: number
          price_year_cents?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          current_position: string | null
          education_level: string | null
          email: string | null
          full_name: string
          id: string
          institution_id: string | null
          level: number
          matching_enabled: boolean
          plan: string
          role: Database["public"]["Enums"]["profile_role"] | null
          streak: number
          target_position: string | null
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          current_position?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string
          id: string
          institution_id?: string | null
          level?: number
          matching_enabled?: boolean
          plan?: string
          role?: Database["public"]["Enums"]["profile_role"] | null
          streak?: number
          target_position?: string | null
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          current_position?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string
          id?: string
          institution_id?: string | null
          level?: number
          matching_enabled?: boolean
          plan?: string
          role?: Database["public"]["Enums"]["profile_role"] | null
          streak?: number
          target_position?: string | null
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      student_verifications: {
        Row: {
          file_path: string
          id: string
          institution_id: string | null
          rejection_reason: string | null
          scope_id: string | null
          status: string
          submitted_at: string
          user_id: string
          valid_until: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          file_path: string
          id?: string
          institution_id?: string | null
          rejection_reason?: string | null
          scope_id?: string | null
          status?: string
          submitted_at?: string
          user_id: string
          valid_until?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          file_path?: string
          id?: string
          institution_id?: string | null
          rejection_reason?: string | null
          scope_id?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
          valid_until?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_verifications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_verifications_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "organization_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_cents: number
          company_id: string | null
          created_at: string
          current_period_end: string | null
          cycle: string
          id: string
          institution_id: string | null
          plan_id: string | null
          seats: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          company_id?: string | null
          created_at?: string
          current_period_end?: string | null
          cycle?: string
          id?: string
          institution_id?: string | null
          plan_id?: string | null
          seats?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          company_id?: string | null
          created_at?: string
          current_period_end?: string | null
          cycle?: string
          id?: string
          institution_id?: string | null
          plan_id?: string | null
          seats?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      test_profile_access: {
        Row: {
          company_id: string | null
          created_at: string
          institution_id: string | null
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          institution_id?: string | null
          role: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          institution_id?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_profile_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_profile_access_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      accepted_candidate_profiles: {
        Args: { _company: string }
        Returns: {
          email: string
          full_name: string
          match_id: string
          skills: string[]
        }[]
      }
      activate_organization: {
        Args: { _id: string; _type: string }
        Returns: undefined
      }
      can_validate_student: {
        Args: { _institution: string; _scope?: string }
        Returns: boolean
      }
      configure_profile: {
        Args: {
          _details: Json
          _role: Database["public"]["Enums"]["profile_role"]
        }
        Returns: undefined
      }
      current_profile_role: {
        Args: never
        Returns: Database["public"]["Enums"]["profile_role"]
      }
      employee_competencies: {
        Args: { _company: string }
        Returns: {
          employee_id: string
          skill: string
        }[]
      }
      get_assessment: { Args: { _module: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      institution_indicators: {
        Args: { _institution_id: string }
        Returns: {
          completion: number
          enrollments: number
          hours: number
          students: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      manage_company: {
        Args: { _action: string; _company: string; _payload: Json }
        Returns: string
      }
      manage_organization_access: {
        Args: { _action: string; _id: string; _payload: Json; _type: string }
        Returns: string
      }
      organization_access: {
        Args: { _id: string; _type: string }
        Returns: Json
      }
      organization_member: {
        Args: { _id: string; _type: string }
        Returns: boolean
      }
      organization_owner: {
        Args: { _id: string; _type: string }
        Returns: string
      }
      organization_permission: {
        Args: {
          _id: string
          _permission: string
          _scope?: string
          _type: string
        }
        Returns: boolean
      }
      owns_company: { Args: { _company_id: string }; Returns: boolean }
      owns_job: { Args: { _job_id: string }; Returns: boolean }
      set_matching: { Args: { _enabled: boolean }; Returns: undefined }
      submit_assessment: {
        Args: { _answers: Json; _complementary?: boolean; _module: string }
        Returns: Json
      }
      submit_student_verification: { Args: { _file: string }; Returns: string }
      switch_test_profile: {
        Args: { _role: Database["public"]["Enums"]["profile_role"] }
        Returns: undefined
      }
      validate_student_verification: {
        Args: {
          _approved: boolean
          _id: string
          _reason: string
          _until: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "staff"
      job_status: "aberta" | "encerrada"
      match_status: "sugerida" | "aceita" | "ignorada"
      profile_role:
        | "estudante"
        | "geral"
        | "colaborador"
        | "professor"
        | "ies"
        | "empresa"
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
      app_role: ["admin", "staff"],
      job_status: ["aberta", "encerrada"],
      match_status: ["sugerida", "aceita", "ignorada"],
      profile_role: [
        "estudante",
        "geral",
        "colaborador",
        "professor",
        "ies",
        "empresa",
      ],
    },
  },
} as const
