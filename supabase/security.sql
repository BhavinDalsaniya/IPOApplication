-- Disable Supabase API access for ipos table
-- Since we use Prisma ORM with direct database connection,
-- we don't need Supabase's REST/GraphQL API access

-- Revoke all permissions from anon and authenticated roles
REVOKE ALL ON TABLE public.ipos FROM anon;
REVOKE ALL ON TABLE public.ipos FROM authenticated;
REVOKE ALL ON TABLE public.ipos FROM service_role;

-- Grant back only to database owner (your Prisma connection)
GRANT ALL ON TABLE public.ipos TO postgres;

-- Repeat for related tables
REVOKE ALL ON TABLE public.price_update_logs FROM anon, authenticated, service_role;
GRANT ALL ON TABLE public.price_update_logs TO postgres;

REVOKE ALL ON TABLE public.ipo_allocations FROM anon, authenticated, service_role;
GRANT ALL ON TABLE public.ipo_allocations TO postgres;

REVOKE ALL ON TABLE public.watchlist_items FROM anon, authenticated, service_role;
GRANT ALL ON TABLE public.watchlist_items TO postgres;

REVOKE ALL ON TABLE public.notifications FROM anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO postgres;

-- Disable Realtime for these tables
ALTER PUBLICATION supabase_realtime DROP TABLE public.ipos;
ALTER PUBLICATION supabase_realtime DROP TABLE public.price_update_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.ipo_allocations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.watchlist_items;
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
