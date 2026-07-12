-- Fix RLS: allow service role to read all profiles
CREATE POLICY "Service role can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Service role can update all profiles" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Allow service role to read all terrains
CREATE POLICY "Service role can read all terrains" ON terrains FOR SELECT USING (true);
CREATE POLICY "Service role can manage all terrains" ON terrains FOR ALL USING (true);

-- Allow service role to read all terrain_photos
CREATE POLICY "Service role can read all photos" ON terrain_photos FOR SELECT USING (true);
CREATE POLICY "Service role can manage all photos" ON terrain_photos FOR ALL USING (true);

-- Allow service role for reservations
CREATE POLICY "Service role can read all reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Service role can manage reservations" ON reservations FOR ALL USING (true);

-- Allow service role for payments
CREATE POLICY "Service role can read all payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Service role can manage payments" ON payments FOR ALL USING (true);
