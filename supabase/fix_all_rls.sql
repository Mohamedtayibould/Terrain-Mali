-- ============================================================
-- FIX COMPLET DES POLICIES RLS - SUPPRIME TOUTES LES RECURSIONS
-- ============================================================
-- Ce script supprime TOUTES les policies existantes sur TOUTES les tables
-- et les recree sans aucune reference circulaire a profiles.

-- === PROFILES ===
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- === TERRAINS ===
DROP POLICY IF EXISTS "Anyone can view active terrains" ON terrains;
DROP POLICY IF EXISTS "Admins can do everything with terrains" ON terrains;
DROP POLICY IF EXISTS "Users can view all active terrains" ON terrains;
DROP POLICY IF EXISTS "Owners can manage their terrains" ON terrains;
DROP POLICY IF EXISTS "Service role can read all terrains" ON terrains;
DROP POLICY IF EXISTS "Service role can manage all terrains" ON terrains;

CREATE POLICY "terrains_select_active" ON terrains FOR SELECT USING (is_active = true);
CREATE POLICY "terrains_select_auth" ON terrains FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "terrains_insert_auth" ON terrains FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "terrains_update_auth" ON terrains FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "terrains_delete_auth" ON terrains FOR DELETE USING (auth.role() = 'authenticated');

-- === TERRAIN_PHOTOS ===
DROP POLICY IF EXISTS "Anyone can view terrain photos" ON terrain_photos;
DROP POLICY IF EXISTS "Admins can manage terrain photos" ON terrain_photos;
DROP POLICY IF EXISTS "Service role can read all photos" ON terrain_photos;
DROP POLICY IF EXISTS "Service role can manage all photos" ON terrain_photos;

CREATE POLICY "photos_select" ON terrain_photos FOR SELECT USING (true);
CREATE POLICY "photos_insert_auth" ON terrain_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "photos_update_auth" ON terrain_photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "photos_delete_auth" ON terrain_photos FOR DELETE USING (auth.role() = 'authenticated');

-- === RESERVATIONS ===
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
DROP POLICY IF EXISTS "Service role can read all reservations" ON reservations;
DROP POLICY IF EXISTS "Service role can manage reservations" ON reservations;

CREATE POLICY "reservations_select_own" ON reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reservations_insert_own" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reservations_select_auth" ON reservations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "reservations_update_auth" ON reservations FOR UPDATE USING (auth.role() = 'authenticated');

-- === PAYMENTS ===
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;
DROP POLICY IF EXISTS "Service role can read all payments" ON payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON payments;

CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_select_auth" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "payments_insert_auth" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "payments_update_auth" ON payments FOR UPDATE USING (auth.role() = 'authenticated');

-- === NOTIFICATIONS ===
DROP POLICY IF EXISTS "Service role manages notifications" ON notifications;
CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true);
