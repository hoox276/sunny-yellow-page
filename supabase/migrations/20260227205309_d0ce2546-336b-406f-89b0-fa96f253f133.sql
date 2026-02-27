
-- =============================================
-- ENUM TYPES
-- =============================================

-- Roles para Admin da Loja
CREATE TYPE public.store_role AS ENUM (
  'admin_loja',
  'gerente',
  'atendente',
  'cozinha',
  'entregador',
  'financeiro'
);

-- Roles para Super Admin
CREATE TYPE public.platform_role AS ENUM (
  'dono_saas',
  'suporte',
  'financeiro_plataforma',
  'operacao'
);

-- =============================================
-- COMPANIES (Empresas)
-- =============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES (Store roles)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role store_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PLATFORM ROLES (Super Admin roles)
-- =============================================
CREATE TABLE public.platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role platform_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PERMISSIONS
-- =============================================
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role store_role NOT NULL,
  resource TEXT NOT NULL,  -- e.g. 'cardapio', 'pedidos', 'configuracoes'
  action TEXT NOT NULL,    -- e.g. 'read', 'create', 'update', 'delete'
  UNIQUE(role, resource, action)
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AUDIT LOGS
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND is_super_admin = true
  )
$$;

-- Check if user has a specific store role in a company
CREATE OR REPLACE FUNCTION public.has_store_role(_user_id UUID, _company_id UUID, _role store_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = _role
  )
$$;

-- Check if user belongs to company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- Check if user has platform role
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id UUID, _role platform_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Companies: super admins see all, users see their own
CREATE POLICY "Super admins can manage all companies"
  ON public.companies FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (id = public.get_user_company_id(auth.uid()));

-- Profiles: users see own, super admins see all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Allow insert for trigger (profile auto-creation)
CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User Roles: company scoped
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can manage company roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.has_store_role(auth.uid(), company_id, 'admin_loja')
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.has_store_role(auth.uid(), company_id, 'admin_loja')
    OR public.is_super_admin(auth.uid())
  );

-- Platform Roles: only super admins
CREATE POLICY "Super admins can manage platform roles"
  ON public.platform_roles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own platform roles"
  ON public.platform_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Permissions: readable by all authenticated
CREATE POLICY "Anyone can read permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage permissions"
  ON public.permissions FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Audit Logs: super admins see all, users see own company
CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Authenticated can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DEFAULT PERMISSIONS
-- =============================================
INSERT INTO public.permissions (role, resource, action) VALUES
  -- admin_loja: full access
  ('admin_loja', 'cardapio', 'read'), ('admin_loja', 'cardapio', 'create'), ('admin_loja', 'cardapio', 'update'), ('admin_loja', 'cardapio', 'delete'),
  ('admin_loja', 'pedidos', 'read'), ('admin_loja', 'pedidos', 'create'), ('admin_loja', 'pedidos', 'update'), ('admin_loja', 'pedidos', 'delete'),
  ('admin_loja', 'clientes', 'read'), ('admin_loja', 'clientes', 'create'), ('admin_loja', 'clientes', 'update'), ('admin_loja', 'clientes', 'delete'),
  ('admin_loja', 'entregas', 'read'), ('admin_loja', 'entregas', 'create'), ('admin_loja', 'entregas', 'update'), ('admin_loja', 'entregas', 'delete'),
  ('admin_loja', 'impressao', 'read'), ('admin_loja', 'impressao', 'create'), ('admin_loja', 'impressao', 'update'), ('admin_loja', 'impressao', 'delete'),
  ('admin_loja', 'configuracoes', 'read'), ('admin_loja', 'configuracoes', 'update'),
  ('admin_loja', 'equipe', 'read'), ('admin_loja', 'equipe', 'create'), ('admin_loja', 'equipe', 'update'), ('admin_loja', 'equipe', 'delete'),
  ('admin_loja', 'qrcode', 'read'), ('admin_loja', 'qrcode', 'create'),
  -- gerente: most access except equipe delete
  ('gerente', 'cardapio', 'read'), ('gerente', 'cardapio', 'create'), ('gerente', 'cardapio', 'update'), ('gerente', 'cardapio', 'delete'),
  ('gerente', 'pedidos', 'read'), ('gerente', 'pedidos', 'create'), ('gerente', 'pedidos', 'update'),
  ('gerente', 'clientes', 'read'), ('gerente', 'clientes', 'update'),
  ('gerente', 'entregas', 'read'), ('gerente', 'entregas', 'update'),
  ('gerente', 'impressao', 'read'), ('gerente', 'impressao', 'update'),
  ('gerente', 'configuracoes', 'read'),
  ('gerente', 'equipe', 'read'),
  ('gerente', 'qrcode', 'read'), ('gerente', 'qrcode', 'create'),
  -- atendente
  ('atendente', 'cardapio', 'read'),
  ('atendente', 'pedidos', 'read'), ('atendente', 'pedidos', 'create'), ('atendente', 'pedidos', 'update'),
  ('atendente', 'clientes', 'read'), ('atendente', 'clientes', 'create'),
  -- cozinha
  ('cozinha', 'pedidos', 'read'), ('cozinha', 'pedidos', 'update'),
  ('cozinha', 'cardapio', 'read'),
  -- entregador
  ('entregador', 'pedidos', 'read'),
  ('entregador', 'entregas', 'read'), ('entregador', 'entregas', 'update'),
  -- financeiro
  ('financeiro', 'pedidos', 'read'),
  ('financeiro', 'clientes', 'read'),
  ('financeiro', 'configuracoes', 'read');
