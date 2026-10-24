-- ==============================================================================
-- BRACU Rideshare - Complete Supabase Schema (100% Idempotent)
-- Safe to run or re-run multiple times without errors
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Students & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('student', 'admin')),
    student_id TEXT,
    role TEXT DEFAULT 'Passenger',
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved')),
    profile_picture TEXT DEFAULT '',
    location TEXT DEFAULT '',
    department TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    profile_complete BOOLEAN DEFAULT FALSE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    theme_preference TEXT DEFAULT 'dark',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE public.profiles ADD COLUMN emergency_contact_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE public.profiles ADD COLUMN emergency_contact_phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'theme_preference') THEN
        ALTER TABLE public.profiles ADD COLUMN theme_preference TEXT DEFAULT 'dark';
    END IF;
END $$;

-- 2. RIDE REQUESTS (Posted by Passengers)
CREATE TABLE IF NOT EXISTS public.ride_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_location TEXT NOT NULL,
    end_location TEXT NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    seats_needed INT DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Accepted', 'Cancelled')),
    accepted_offer_id UUID,
    start_lat DOUBLE PRECISION,
    start_lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    estimated_distance_km NUMERIC,
    estimated_fare NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'start_lat') THEN
        ALTER TABLE public.ride_requests ADD COLUMN start_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'start_lng') THEN
        ALTER TABLE public.ride_requests ADD COLUMN start_lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'end_lat') THEN
        ALTER TABLE public.ride_requests ADD COLUMN end_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'end_lng') THEN
        ALTER TABLE public.ride_requests ADD COLUMN end_lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'estimated_distance_km') THEN
        ALTER TABLE public.ride_requests ADD COLUMN estimated_distance_km NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_requests' AND column_name = 'estimated_fare') THEN
        ALTER TABLE public.ride_requests ADD COLUMN estimated_fare NUMERIC;
    END IF;
END $$;

-- 3. RIDE OFFERS (Bids by Riders for a Request)
CREATE TABLE IF NOT EXISTS public.ride_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.ride_requests(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fare NUMERIC NOT NULL,
    note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (request_id, rider_id)
);

-- Add foreign key constraint for accepted_offer_id in ride_requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_accepted_offer' AND table_name = 'ride_requests'
    ) THEN
        ALTER TABLE public.ride_requests
        ADD CONSTRAINT fk_accepted_offer
        FOREIGN KEY (accepted_offer_id) REFERENCES public.ride_offers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. ACTIVE RIDES (Created once offer is accepted, with real-time location tracking)
CREATE TABLE IF NOT EXISTS public.active_rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES public.ride_requests(id) ON DELETE SET NULL,
    offer_id UUID REFERENCES public.ride_offers(id) ON DELETE SET NULL,
    rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fare NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ongoing' CHECK (status IN ('Ongoing', 'Arrived', 'Completed', 'Cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid')),
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    rider_latitude DOUBLE PRECISION,
    rider_longitude DOUBLE PRECISION,
    rider_heading DOUBLE PRECISION DEFAULT 0,
    rider_speed DOUBLE PRECISION DEFAULT 0,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    dropoff_lat DOUBLE PRECISION,
    dropoff_lng DOUBLE PRECISION,
    eta_minutes INT DEFAULT 5,
    sos_triggered BOOLEAN DEFAULT FALSE,
    last_location_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'rider_latitude') THEN
        ALTER TABLE public.active_rides ADD COLUMN rider_latitude DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'rider_longitude') THEN
        ALTER TABLE public.active_rides ADD COLUMN rider_longitude DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'rider_heading') THEN
        ALTER TABLE public.active_rides ADD COLUMN rider_heading DOUBLE PRECISION DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'rider_speed') THEN
        ALTER TABLE public.active_rides ADD COLUMN rider_speed DOUBLE PRECISION DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'pickup_lat') THEN
        ALTER TABLE public.active_rides ADD COLUMN pickup_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'pickup_lng') THEN
        ALTER TABLE public.active_rides ADD COLUMN pickup_lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'dropoff_lat') THEN
        ALTER TABLE public.active_rides ADD COLUMN dropoff_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'dropoff_lng') THEN
        ALTER TABLE public.active_rides ADD COLUMN dropoff_lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'eta_minutes') THEN
        ALTER TABLE public.active_rides ADD COLUMN eta_minutes INT DEFAULT 5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'sos_triggered') THEN
        ALTER TABLE public.active_rides ADD COLUMN sos_triggered BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_rides' AND column_name = 'last_location_updated_at') THEN
        ALTER TABLE public.active_rides ADD COLUMN last_location_updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 5. CHAT MESSAGES (Live in-ride messaging)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES public.active_rides(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FEEDBACK
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES public.active_rides(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Visible' CHECK (status IN ('Visible', 'Hidden')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (ride_id, passenger_id)
);

-- 8. VEHICLES (For Riders)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. STANDALONE RIDES & BOOKINGS
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    start_location TEXT NOT NULL,
    end_location TEXT NOT NULL,
    ride_date_time TIMESTAMPTZ NOT NULL,
    fare NUMERIC NOT NULL,
    seats INT DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Booked', 'Completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Cancelled')),
    payment_method TEXT,
    amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME (Idempotent publication addition)
-- ==============================================================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['ride_requests', 'ride_offers', 'active_rides', 'chats', 'notifications'])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Idempotent Drop & Recreate)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public ride_requests access" ON public.ride_requests;
CREATE POLICY "Public ride_requests access" ON public.ride_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public ride_offers access" ON public.ride_offers;
CREATE POLICY "Public ride_offers access" ON public.ride_offers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public active_rides access" ON public.active_rides;
CREATE POLICY "Public active_rides access" ON public.active_rides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public chats access" ON public.chats;
CREATE POLICY "Public chats access" ON public.chats FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public notifications access" ON public.notifications;
CREATE POLICY "Public notifications access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public feedbacks access" ON public.feedbacks;
CREATE POLICY "Public feedbacks access" ON public.feedbacks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public vehicles access" ON public.vehicles;
CREATE POLICY "Public vehicles access" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public rides access" ON public.rides;
CREATE POLICY "Public rides access" ON public.rides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public bookings access" ON public.bookings;
CREATE POLICY "Public bookings access" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SEED DEFAULT SUPER ADMIN
-- ==============================================================================
INSERT INTO public.profiles (name, email, phone, user_type, status, profile_complete)
VALUES ('Super Admin', 'admin@gmail.com', '01700000000', 'admin', 'Approved', true)
ON CONFLICT (email) DO NOTHING;

-- ==============================================================================
-- STORAGE BUCKET (For Profile Pictures)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar bucket public select" ON storage.objects;
CREATE POLICY "Avatar bucket public select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar bucket public insert" ON storage.objects;
CREATE POLICY "Avatar bucket public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar bucket public update" ON storage.objects;
CREATE POLICY "Avatar bucket public update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

-- ==============================================================================
-- PERFORMANCE INDEXES (Idempotent)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_active_rides_rider_id ON public.active_rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_active_rides_passenger_id ON public.active_rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_active_rides_status ON public.active_rides(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON public.ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_request_id ON public.ride_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_chats_ride_id ON public.chats(ride_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON public.notifications(receiver_id);
