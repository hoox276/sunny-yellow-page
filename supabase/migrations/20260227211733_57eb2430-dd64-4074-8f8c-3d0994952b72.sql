
-- Enum for order status
CREATE TYPE public.order_status AS ENUM (
  'novo', 'em_preparo', 'pronto', 'saiu_entrega', 'concluido', 'cancelado'
);

-- Enum for order type
CREATE TYPE public.order_type AS ENUM (
  'entrega', 'retirada', 'local'
);

-- Enum for payment method
CREATE TYPE public.payment_method AS ENUM (
  'pix', 'dinheiro', 'cartao_entrega'
);

-- Enum for variation selection type
CREATE TYPE public.variation_type AS ENUM (
  'unica', 'multipla'
);

-- ==================== MENU TABLES ====================

-- Categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  schedule_start TIME,
  schedule_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Company admins manage categories" ON public.categories
  FOR ALL USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admins manage all categories" ON public.categories
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_urls TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_out_of_stock BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true AND is_out_of_stock = false);
CREATE POLICY "Company admins manage products" ON public.products
  FOR ALL USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admins manage all products" ON public.products
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Variation Groups (e.g. "Tamanho", "Sabor")
CREATE TABLE public.variation_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type variation_type NOT NULL DEFAULT 'unica',
  min_selections INT NOT NULL DEFAULT 1,
  max_selections INT NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.variation_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view variation groups" ON public.variation_groups
  FOR SELECT USING (true);
CREATE POLICY "Company admins manage variation groups" ON public.variation_groups
  FOR ALL USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Variation Options
CREATE TABLE public.variation_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.variation_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.variation_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view variation options" ON public.variation_options
  FOR SELECT USING (is_active = true);
CREATE POLICY "Company admins manage variation options" ON public.variation_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.variation_groups vg
      WHERE vg.id = group_id AND vg.company_id = get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.variation_groups vg
      WHERE vg.id = group_id AND vg.company_id = get_user_company_id(auth.uid())
    )
  );

-- Addon Groups
CREATE TABLE public.addon_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_selections INT NOT NULL DEFAULT 0,
  max_selections INT NOT NULL DEFAULT 5,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.addon_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view addon groups" ON public.addon_groups
  FOR SELECT USING (true);
CREATE POLICY "Company admins manage addon groups" ON public.addon_groups
  FOR ALL USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Addon Items
CREATE TABLE public.addon_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.addon_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.addon_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view addon items" ON public.addon_items
  FOR SELECT USING (is_active = true);
CREATE POLICY "Company admins manage addon items" ON public.addon_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.addon_groups ag
      WHERE ag.id = group_id AND ag.company_id = get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.addon_groups ag
      WHERE ag.id = group_id AND ag.company_id = get_user_company_id(auth.uid())
    )
  );

-- Combos
CREATE TABLE public.combos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active combos" ON public.combos
  FOR SELECT USING (is_active = true);
CREATE POLICY "Company admins manage combos" ON public.combos
  FOR ALL USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Combo Items (fixed items and choice groups)
CREATE TABLE public.combo_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_choice BOOLEAN NOT NULL DEFAULT false,
  choice_label TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view combo items" ON public.combo_items
  FOR SELECT USING (true);
CREATE POLICY "Company admins manage combo items" ON public.combo_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.combos c
      WHERE c.id = combo_id AND c.company_id = get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.combos c
      WHERE c.id = combo_id AND c.company_id = get_user_company_id(auth.uid())
    )
  );

-- ==================== DELIVERY TABLES ====================

-- Neighborhoods (delivery zones)
CREATE TABLE public.neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_time TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active neighborhoods" ON public.neighborhoods
  FOR SELECT USING (is_active = true);
CREATE POLICY "Company admins manage neighborhoods" ON public.neighborhoods
  FOR ALL USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Drivers
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins manage drivers" ON public.drivers
  FOR ALL USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- ==================== COUPONS ====================

CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses INT DEFAULT 0,
  current_uses INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);
CREATE POLICY "Company admins manage coupons" ON public.coupons
  FOR ALL USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- ==================== ORDERS ====================

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  type order_type NOT NULL DEFAULT 'entrega',
  status order_status NOT NULL DEFAULT 'novo',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'pix',
  change_for NUMERIC(10,2),
  address TEXT,
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  address_reference TEXT,
  coupon_id UUID REFERENCES public.coupons(id),
  estimated_minutes INT,
  cancel_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Public can insert orders (no auth required)
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);
-- Public can view their own order by id (for tracking)
CREATE POLICY "Anyone can view orders by id" ON public.orders
  FOR SELECT USING (true);
-- Company admins manage orders
CREATE POLICY "Company admins manage orders" ON public.orders
  FOR ALL USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admins manage all orders" ON public.orders
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Order Items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  variations JSONB DEFAULT '[]',
  addons JSONB DEFAULT '[]',
  notes TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order items" ON public.order_items
  FOR SELECT USING (true);
CREATE POLICY "Company admins manage order items" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.company_id = get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.company_id = get_user_company_id(auth.uid())
    )
  );

-- Order Status History
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view order history" ON public.order_status_history
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert order history" ON public.order_status_history
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Company admins manage order history" ON public.order_status_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.company_id = get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.company_id = get_user_company_id(auth.uid())
    )
  );

-- ==================== TRIGGERS ====================

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_combos_updated_at BEFORE UPDATE ON public.combos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ==================== INDEXES ====================

CREATE INDEX idx_categories_company ON public.categories(company_id);
CREATE INDEX idx_products_company ON public.products(company_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_orders_company ON public.orders(company_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_neighborhoods_company ON public.neighborhoods(company_id);
CREATE INDEX idx_coupons_company_code ON public.coupons(company_id, code);

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
