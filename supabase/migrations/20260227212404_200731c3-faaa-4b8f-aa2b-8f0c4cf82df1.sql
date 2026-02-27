
-- Cash transactions table
CREATE TABLE public.cash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  order_id uuid REFERENCES public.orders(id),
  type text NOT NULL CHECK (type IN ('entrada', 'saida')),
  category text NOT NULL DEFAULT 'pedido',
  description text NOT NULL,
  payment_method text,
  amount numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins manage cash transactions"
ON public.cash_transactions FOR ALL
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Cash closings table
CREATE TABLE public.cash_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  closed_by uuid,
  total_entries numeric NOT NULL DEFAULT 0,
  total_exits numeric NOT NULL DEFAULT 0,
  total_balance numeric NOT NULL DEFAULT 0,
  payment_breakdown jsonb DEFAULT '{}',
  manual_balance numeric,
  notes text,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins manage cash closings"
ON public.cash_closings FOR ALL
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Add driver_id to orders for delivery assignment
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Add min_order_value and category_id to coupons
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_value numeric DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses_per_customer integer;

-- Indexes
CREATE INDEX idx_cash_transactions_company ON public.cash_transactions(company_id, created_at);
CREATE INDEX idx_cash_closings_company ON public.cash_closings(company_id, created_at);
CREATE INDEX idx_orders_driver ON public.orders(driver_id);
