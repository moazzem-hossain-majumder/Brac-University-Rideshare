-- ==============================================================================
-- BRACU Rideshare - Idempotent Migration Script (v2: Live Map & Location Tracking)
-- All statements are safe to run repeatedly (IF NOT EXISTS / DO $$ block checks)
-- ==============================================================================

-- 1. Ensure UUID Extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Add Location & Navigation Columns to active_rides
DO $$ 
BEGIN
    -- Rider real-time GPS coordinates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'rider_latitude') THEN
        ALTER TABLE public.active_rides ADD COLUMN rider_latitude DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'rider_longitude') THEN
        ALTER TABLE public.active_rides ADD COLUMN rider_longitude DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'rider_heading') THEN
        ALTER TABLE public.active_rides ADD COLUMN rider_heading DOUBLE PRECISION DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'rider_speed') THEN
        ALTER TABLE public.active_rides ADD COLUMN rider_speed DOUBLE PRECISION DEFAULT 0;
    END IF;

    -- Pickup & Dropoff Coordinates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'pickup_lat') THEN
        ALTER TABLE public.active_rides ADD COLUMN pickup_lat DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'pickup_lng') THEN
        ALTER TABLE public.active_rides ADD COLUMN pickup_lng DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'dropoff_lat') THEN
        ALTER TABLE public.active_rides ADD COLUMN dropoff_lat DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'dropoff_lng') THEN
        ALTER TABLE public.active_rides ADD COLUMN dropoff_lng DOUBLE PRECISION;
    END IF;

    -- ETA & Safety
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'eta_minutes') THEN
        ALTER TABLE public.active_rides ADD COLUMN eta_minutes INT DEFAULT 5;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'sos_triggered') THEN
        ALTER TABLE public.active_rides ADD COLUMN sos_triggered BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'active_rides' AND column_name = 'last_location_updated_at') THEN
        ALTER TABLE public.active_rides ADD COLUMN last_location_updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Add Coordinates and Distance to ride_requests
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'start_lat') THEN
        ALTER TABLE public.ride_requests ADD COLUMN start_lat DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'start_lng') THEN
        ALTER TABLE public.ride_requests ADD COLUMN start_lng DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'end_lat') THEN
        ALTER TABLE public.ride_requests ADD COLUMN end_lat DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'end_lng') THEN
        ALTER TABLE public.ride_requests ADD COLUMN end_lng DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'estimated_distance_km') THEN
        ALTER TABLE public.ride_requests ADD COLUMN estimated_distance_km NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'estimated_fare') THEN
        ALTER TABLE public.ride_requests ADD COLUMN estimated_fare NUMERIC;
    END IF;
END $$;

-- 4. Add Safety & Theme Columns to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE public.profiles ADD COLUMN emergency_contact_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE public.profiles ADD COLUMN emergency_contact_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'theme_preference') THEN
        ALTER TABLE public.profiles ADD COLUMN theme_preference TEXT DEFAULT 'dark';
    END IF;
END $$;

-- 5. Ensure Realtime is enabled for active_rides (if not already published)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'active_rides'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.active_rides;
    END IF;
END $$;

-- 6. Add Performance Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_active_rides_rider_id ON public.active_rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_active_rides_passenger_id ON public.active_rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_active_rides_status ON public.active_rides(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON public.ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_request_id ON public.ride_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_chats_ride_id ON public.chats(ride_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON public.notifications(receiver_id);
