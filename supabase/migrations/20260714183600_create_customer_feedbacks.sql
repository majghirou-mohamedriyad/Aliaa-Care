-- Migration: Create customer_feedbacks table and feedback helper function
CREATE TABLE IF NOT EXISTS public.customer_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    service_rating INTEGER NOT NULL CHECK (service_rating >= 1 AND service_rating <= 5),
    product_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_feedbacks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.customer_feedbacks;
DROP POLICY IF EXISTS "Admins can view feedback" ON public.customer_feedbacks;

-- Policy to allow anyone to insert feedbacks (anonymous submissions)
CREATE POLICY "Anyone can insert feedback" ON public.customer_feedbacks
    FOR INSERT WITH CHECK (true);

-- Policy to allow only admins to read feedbacks
CREATE POLICY "Admins can view feedback" ON public.customer_feedbacks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create a secure RPC function to get public order info for feedback without exposing PII
CREATE OR REPLACE FUNCTION public.get_order_for_feedback(target_order_id UUID)
RETURNS TABLE (
    customer_name TEXT,
    order_number TEXT,
    items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.customer_name::TEXT,
        o.order_number::TEXT,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'product_id', oi.product_id,
                    'product_name', oi.product_name,
                    'quantity', oi.quantity
                )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::jsonb
        ) AS items
    FROM public.orders o
    LEFT JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.id = target_order_id
    GROUP BY o.id, o.customer_name, o.order_number;
END;
$$;

-- Grant execute permissions to public/anonymous users
GRANT EXECUTE ON FUNCTION public.get_order_for_feedback(UUID) TO anon, authenticated, service_role;
